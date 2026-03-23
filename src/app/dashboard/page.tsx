import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-12 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          Creator<span className="text-accent">.</span>Dashboard
        </h1>
        <Link
          href="/dashboard/upload"
          className="flex items-center gap-2 bg-accent text-background font-medium px-5 py-2.5 rounded-lg hover:bg-accent-dim transition-colors"
        >
          <span className="text-lg">+</span> New Release
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Releases', value: '0', icon: '🎵' },
          { label: 'Total Plays', value: '0', icon: '▶' },
          { label: 'Subscribers', value: 'Free', icon: '💎' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface border border-border rounded-xl p-5 text-center"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-text-tertiary mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Releases Table */}
      <section>
        <h2 className="text-lg font-serif mb-4">Your Releases</h2>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-text-secondary">
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Plays</th>
                <th className="text-right px-4 py-3">LUFS</th>
                <th className="text-right px-4 py-3">SDD Offset</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-tertiary">
                  <div className="space-y-3">
                    <div className="text-3xl">🎵</div>
                    <p>No releases yet</p>
                    <Link
                      href="/dashboard/upload"
                      className="inline-block text-accent hover:text-accent-dim transition-colors text-sm"
                    >
                      Upload your first release →
                    </Link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
