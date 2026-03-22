export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
          Dynamics<span className="text-accent">.</span>art
        </h1>
        <p className="text-lg text-text-secondary leading-relaxed max-w-lg mx-auto">
          Where sound meets artistry. A high-fidelity platform that respects
          dynamic range — no limiters, no compression, just pure sound.
        </p>
        <div className="pt-4">
          <span className="inline-block px-4 py-2 text-sm text-text-tertiary border border-border rounded-full">
            Coming Soon
          </span>
        </div>
      </div>
    </main>
  );
}
