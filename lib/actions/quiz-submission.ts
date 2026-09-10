// lib/actions/quiz-submission.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { StatusQuizEngine } from '@/lib/engine/games/StatusQuizEngine';
import { SessionManager } from '@/lib/engine/SessionManager';
import { revalidatePath } from 'next/cache';

interface SubmitAnswerPayload {
  sessionId: string;
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D';
}

export async function submitQuizAnswer({
  sessionId,
  questionId,
  selectedOption,
}: SubmitAnswerPayload) {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Fetch session and verify ownership & status
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !session || session.status !== 'active') {
    return { success: false, error: 'Invalid or expired game session' };
  }

  // 3. Verify server-side timer (60 seconds + 3s network grace period)
  const startTime = new Date(session.created_at).getTime();
  const maxDurationMs = (session.config.time_limit_seconds + 3) * 1000;
  if (Date.now() - startTime > maxDurationMs) {
    // Session expired: Mark as abandoned
    await supabase
      .from('game_sessions')
      .update({ status: 'abandoned' })
      .eq('id', sessionId);

    return { success: false, error: 'Quiz time limit exceeded' };
  }

  // 4. Fetch the hidden correct answer directly on the server
  const { data: question, error: qError } = await supabase
    .from('quiz_questions')
    .select('correct_option')
    .eq('id', questionId)
    .single();

  if (qError || !question) {
    return { success: false, error: 'Question not found' };
  }

  const isCorrect = question.correct_option === selectedOption;
  const pointsAwarded = isCorrect ? 10 : 0;

  // 5. Update session question state in database
  const { error: updateError } = await supabase
    .from('quiz_session_questions')
    .update({
      selected_option: selectedOption,
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
      answered_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)
    .eq('question_id', questionId);

  if (updateError) {
    return { success: false, error: 'Failed to record answer' };
  }

  // 6. Check if all questions in session are answered
  const { data: remaining } = await supabase
    .from('quiz_session_questions')
    .select('id')
    .eq('session_id', sessionId)
    .is('selected_option', null);

  const isComplete = !remaining || remaining.length === 0;

  // 7. If all answered, finalize score and process atomic SFP reward pipeline
  if (isComplete) {
    const { data: allAnswers } = await supabase
      .from('quiz_session_questions')
      .select('points_awarded')
      .eq('session_id', sessionId);

    const totalScore = (allAnswers || []).reduce((acc, curr) => acc + (Number(curr.points_awarded) || 0), 0);

    // Update state to completed
    const updatedState = { ...session.state, score: totalScore };
    await supabase
      .from('game_sessions')
      .update({ status: 'completed', state: updatedState })
      .eq('id', sessionId);

    // Execute SFP Wallet Reward Pipeline
    const quizEngine = new StatusQuizEngine();
    const rewardOutcome = await quizEngine['computeRawReward']({
      ...session,
      state: updatedState,
    });

    const rewardResult = await SessionManager.runRewardPipeline(
      user.id,
      sessionId,
      'statusquiz',
      rewardOutcome
    );

    revalidatePath('/games/statusquiz');

    return {
      success: true,
      isComplete: true,
      score: totalScore,
      sfpEarned: rewardOutcome.sfpAmount,
      rewardSuccess: rewardResult.success,
    };
  }

  return { success: true, isComplete: false, isCorrect };
}
