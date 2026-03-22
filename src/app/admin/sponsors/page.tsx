'use client';

import { useState } from 'react';

interface SponsorTrack {
  id: string;
  brandName: string;
  campaignName: string | null;
  status: string;
  lufsRaw: number | null;
  gainOffsetDb: number | null;
  createdAt: string | null;
}

export default function SponsorsPage() {
  const [tracks, setTracks] = useState<SponsorTrack[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [brandName, setBrandName] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file || !brandName.trim()) return;
    setUploading(true);
    // TODO: Upload sponsor audio to R2, trigger SDD pipeline
    // The same worker processes it — compressed ads get minimal SDD discount
    setUploading(false);
  };

  return (
    <main className="flex flex-1 flex-col px-6 py-12 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8">
        Sponsors<span className="text-accent">.</span>Dashboard
      </h1>

      {/* Upload New Sponsor Audio */}
      <section className="bg-surface border border-border rounded-xl p-6 mb-8 space-y-4">
        <h2 className="text-lg font-serif">Upload Sponsor Creative</h2>
        <p className="text-xs text-text-tertiary">
          All sponsor audio runs through the SDD pipeline.
          Hyper-compressed ads receive no discount and are mathematically turned <strong>down</strong>.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Brand Name</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-accent transition-colors"
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-accent transition-colors"
              placeholder="Spring 2025"
            />
          </div>
        </div>

        <input
          type="file"
          accept=".wav,.mp3,.flac"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-surface-elevated file:text-foreground"
        />

        <button
          onClick={handleUpload}
          disabled={uploading || !file || !brandName.trim()}
          className="bg-accent text-background font-medium px-6 py-2.5 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-50"
        >
          {uploading ? 'Processing...' : 'Upload & Analyze'}
        </button>
      </section>

      {/* Sponsor Tracks Table */}
      <section>
        <h2 className="text-lg font-serif mb-4">Active Campaigns</h2>
        {tracks.length === 0 ? (
          <p className="text-text-tertiary text-sm">No sponsor audio uploaded yet.</p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface text-text-secondary">
                  <th className="text-left px-4 py-3">Brand</th>
                  <th className="text-left px-4 py-3">Campaign</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">LUFS</th>
                  <th className="text-right px-4 py-3">SDD Offset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tracks.map((track) => (
                  <tr key={track.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3">{track.brandName}</td>
                    <td className="px-4 py-3 text-text-secondary">{track.campaignName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        track.status === 'active' ? 'bg-green-900/50 text-green-300'
                        : track.status === 'approved' ? 'bg-blue-900/50 text-blue-300'
                        : track.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300'
                        : 'bg-red-900/50 text-red-300'
                      }`}>
                        {track.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-tertiary">
                      {track.lufsRaw?.toFixed(1) || '—'} dB
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-accent">
                      {track.gainOffsetDb !== null ? `${track.gainOffsetDb > 0 ? '+' : ''}${track.gainOffsetDb.toFixed(1)} dB` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
