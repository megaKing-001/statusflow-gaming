// app/games/statusquiz/page.tsx
import { startQuizSession } from '@/lib/actions/quiz';
import QuizClient from './QuizClient';

export const revalidate = 0; // Disable static caching for live sessions

export default async function StatusQuizPage() {
  try {
    const sessionData = await startQuizSession();

    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col justify-center">
        <QuizClient 
          sessionId={sessionData.sessionId} 
          initialQuestions={sessionData.questions} 
        />
      </main>
    );
  } catch (err: any) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <div className="max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <h2 className="text-xl font-bold text-rose-400 mb-2">Session Error</h2>
          <p className="text-slate-400 text-sm">{err.message || 'Unable to start quiz session.'}</p>
        </div>
      </main>
    );
  }
}
