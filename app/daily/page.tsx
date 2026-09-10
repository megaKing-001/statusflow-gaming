// app/daily/page.tsx
import DailyClaimClient from './DailyClaimClient';

export const revalidate = 0;

export default function DailyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col justify-center">
      <DailyClaimClient />
    </main>
  );
}
