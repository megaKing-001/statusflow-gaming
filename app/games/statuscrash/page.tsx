// app/games/statuscrash/page.tsx
import CrashClient from './CrashClient';

export const revalidate = 0;

export default function StatusCrashPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col justify-center">
      <CrashClient />
    </main>
  );
}
