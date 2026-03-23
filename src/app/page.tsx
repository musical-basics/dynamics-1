import Link from 'next/link';

const TEST_LINKS = [
  { href: '/login', label: 'Login', icon: '🔑' },
  { href: '/signup', label: 'Sign Up', icon: '✍️' },
  { href: '/pricing', label: 'Pricing', icon: '💎' },
  { href: '/dashboard/upload', label: 'Upload', icon: '📤' },
  { href: '/admin/sponsors', label: 'Sponsors', icon: '📢' },
];

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
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto">
          {TEST_LINKS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border rounded-xl text-sm hover:border-accent hover:text-accent transition-colors"
            >
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
        <p className="text-xs text-text-tertiary pt-2">⬆ Test navigation links</p>
      </div>
    </main>
  );
}
