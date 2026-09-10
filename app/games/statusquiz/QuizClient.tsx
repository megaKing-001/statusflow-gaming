// app/games/statusquiz/QuizClient.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { submitQuizAnswer } from '@/lib/actions/quiz-submission';
import { Clock, CheckCircle2, XCircle, Award, ArrowRight } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  question_order: number;
}

interface QuizClientProps {
  sessionId: string;
  initialQuestions: Question[];
}

export default function QuizClient({ sessionId, initialQuestions }: QuizClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ isComplete: boolean; score?: number; sfpEarned?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = initialQuestions[currentIndex];

  // Server-authoritative visual timer sync
  useEffect(() => {
    if (timeLeft <= 0 || result?.isComplete) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result?.isComplete]);

  const handleOptionSelect = (option: 'A' | 'B' | 'C' | 'D') => {
    if (isPending || selectedOption !== null) return;
    setSelectedOption(option);

    startTransition(async () => {
      const response = await submitQuizAnswer({
        sessionId,
        questionId: currentQuestion.id,
        selectedOption: option,
      });

      if (!response.success) {
        setError(response.error || 'Failed to submit answer');
        return;
      }

      if (response.isComplete) {
        setResult({
          isComplete: true,
          score: response.score,
          sfpEarned: response.sfpEarned,
        });
      } else {
        // Move to next question after a brief feedback pause
        setTimeout(() => {
          setSelectedOption(null);
          setCurrentIndex((prev) => prev + 1);
        }, 600);
      }
    });
  };

  if (result?.isComplete) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center shadow-xl">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <Award size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h2>
        <p className="text-slate-400 text-sm mb-6">Your answers have been verified on the server.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Final Score</span>
            <span className="text-2xl font-black text-white">{result.score} pts</span>
          </div>
          <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-500/30">
            <span className="text-xs text-emerald-400 uppercase tracking-wider block mb-1">SFP Earned</span>
            <span className="text-2xl font-black text-emerald-400">+{result.sfpEarned} SFP</span>
          </div>
        </div>

        <button
          onClick={() => window.location.href = '/games/statusquiz'}
          className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
        >
          Play Again
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Question {currentIndex + 1} of {initialQuestions.length}
        </span>
        <div className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${
          timeLeft < 15 
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
            : 'bg-slate-800 text-slate-300 border-slate-700'
        }`}>
          <Clock size={16} />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Question Text */}
      <h3 className="text-lg font-semibold text-white mb-6 leading-relaxed">
        {currentQuestion.question_text}
      </h3>

      {/* Options Grid */}
      <div className="space-y-3 mb-6">
        {(['A', 'B', 'C', 'D'] as const).map((key) => {
          const optionText = currentQuestion[`option_${key.toLowerCase()}` as keyof Question];
          const isSelected = selectedOption === key;

          return (
            <button
              key={key}
              disabled={isPending || selectedOption !== null}
              onClick={() => handleOptionSelect(key)}
              className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-medium'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
              } disabled:opacity-80`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border ${
                  isSelected 
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                    : 'bg-slate-700/50 border-slate-600 text-slate-400'
                }`}>
                  {key}
                </span>
                <span className="text-sm">{optionText}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
