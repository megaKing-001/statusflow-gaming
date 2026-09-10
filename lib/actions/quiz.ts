// lib/actions/quiz.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function startQuizSession() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // 1. Active Session Guard: Prevent spamming multiple active sessions
  const { data: existingSession } = await supabase
    .from('game_sessions')
    .select('id, status, created_at')
    .eq('user_id', user.id)
    .eq('game_type', 'statusquiz')
    .eq('status', 'active')
    .maybeSingle();

  if (existingSession) {
    // Fetch sanitized questions for the existing active session
    const { data: questions } = await supabase.rpc('get_session_questions_safe', {
      p_session_id: existingSession.id,
    });

    return {
      sessionId: existingSession.id,
      questions: questions || [],
      resumed: true,
    };
  }

  // 2. Create New Session
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .insert({
      user_id: user.id,
      game_type: 'statusquiz',
      status: 'active',
      state: { score: 0, answers: {} },
      config: { question_count: 10, time_limit_seconds: 60 },
    })
    .select()
    .single();

  if (sessionError || !session) {
    throw new Error(`Failed to initialize quiz session: ${sessionError?.message}`);
  }

  // 3. Select 10 Random Active Questions
  const { data: randomQuestions, error: qError } = await supabase
    .from('quiz_questions')
    .select('id')
    .eq('status', 'active')
    .limit(10);

  if (qError || !randomQuestions || randomQuestions.length === 0) {
    throw new Error('No active questions available');
  }

  // 4. Assign Session Questions
  const sessionQuestions = randomQuestions.map((q, index) => ({
    session_id: session.id,
    question_id: q.id,
    question_order: index + 1,
  }));

  await supabase.from('quiz_session_questions').insert(sessionQuestions);

  // 5. Fetch Sanitized Player View (Excludes correct_option)
  const { data: questions } = await supabase.rpc('get_session_questions_safe', {
    p_session_id: session.id,
  });

  revalidatePath('/games/statusquiz');

  return {
    sessionId: session.id,
    questions: questions || [],
    resumed: false,
  };
}
