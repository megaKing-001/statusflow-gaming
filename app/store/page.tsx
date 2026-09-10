// app/store/page.tsx
import StoreClient from './StoreClient';

export default function StorePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col justify-center">
      <StoreClient />
    </main>
  );
}
