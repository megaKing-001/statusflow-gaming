// app/layout.tsx
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata = {
  title: 'MegaGames - Zero-Trust SFP Platform',
  description: 'Play games, earn SFP rewards, and manage your balance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
        <Navbar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
