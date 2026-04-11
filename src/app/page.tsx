import { Board } from '@/components/Board';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12">
      <div className="max-w-[1600px] mx-auto">
        <Board />
      </div>
    </main>
  );
}
