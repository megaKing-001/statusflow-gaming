// app/games/statuscards/page.tsx
import { CardsClient } from './CardsClient';

export const revalidate = 0;

export default function StatusCardsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CardsClient />
    </main>
  );
}
