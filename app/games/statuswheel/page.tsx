// app/games/statuswheel/page.tsx
import WheelClient from './WheelClient';

export const revalidate = 0;

export default function StatusWheelPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col justify-center">
      <WheelClient />
    </main>
  );
}
