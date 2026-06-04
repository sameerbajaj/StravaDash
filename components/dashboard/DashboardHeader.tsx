'use client';

import { useState } from 'react';
import { RefreshCw, LogOut, ShieldAlert } from 'lucide-react';

interface AthleteProfile {
  id: number;
  username: string | null;
  firstname: string;
  lastname: string;
  profile: string | null;
}

interface DashboardHeaderProps {
  athlete: AthleteProfile | null;
  isDemo: boolean;
  onSync: () => Promise<void>;
  onToggleDemo: () => void;
  onLogout: () => Promise<void>;
}

export default function DashboardHeader({
  athlete,
  isDemo,
  onSync,
  onToggleDemo,
  onLogout,
}: DashboardHeaderProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncClick = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      await onSync();
    } catch (err: unknown) {
      setSyncError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-md bg-orange flex items-center justify-center font-mono font-bold text-black text-xl shadow-[0_0_15px_rgba(255,75,0,0.5)]">
            SD
          </div>
          <div>
            <h1 className="text-md font-extrabold tracking-widest text-white flex items-center gap-1.5">
              STRAVADASH <span className="text-volt font-mono font-normal text-xs px-1 border border-volt/30 rounded uppercase tracking-normal">CHRONO-HUB</span>
            </h1>
            <p className="text-[10px] text-slate-text font-mono uppercase tracking-wider">Premium Performance Engine</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-4">
          {/* Demo Toggle */}
          <button
            onClick={onToggleDemo}
            className={`px-3 py-1.5 rounded text-[11px] font-mono border transition-all ${
              isDemo
                ? 'bg-volt/10 border-volt text-volt hover:bg-volt/20'
                : 'border-white/10 text-slate-text hover:text-white hover:border-white/20'
            }`}
          >
            {isDemo ? 'DEMO ACTIVE' : 'LOAD DEMO DATA'}
          </button>

          {/* Athlete Profile */}
          {athlete && (
            <div className="flex items-center space-x-3 border-l border-white/10 pl-4">
              <div className="relative">
                {athlete.profile ? (
                  <img
                    src={athlete.profile}
                    alt={athlete.firstname}
                    className="h-9 w-9 rounded-full border border-white/20 object-cover shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full border border-white/20 bg-card-bg flex items-center justify-center text-xs font-bold text-white">
                    {athlete.firstname[0]}
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-black ${isDemo ? 'bg-amber-400' : 'bg-green-500'}`} />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-white">
                  {athlete.firstname} {athlete.lastname}
                </p>
                <p className="text-[10px] text-slate-text font-mono">
                  ID: #{athlete.id === 0 ? 'MOCK_USER' : athlete.id}
                </p>
              </div>

              {/* Sync Trigger */}
              {!isDemo && athlete.id !== 0 && (
                <button
                  onClick={handleSyncClick}
                  disabled={syncing}
                  className={`p-2 rounded border border-white/5 hover:border-volt/20 bg-white/5 text-slate-text hover:text-volt transition-all disabled:opacity-50 ${syncing ? 'animate-spin text-volt' : ''}`}
                  title="Sync with Strava"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}

              {/* Disconnect / Logout */}
              <button
                onClick={onLogout}
                className="p-2 rounded border border-white/5 hover:border-red-500/20 bg-white/5 text-slate-text hover:text-red-500 transition-all"
                title="Disconnect Account"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sync Error Alert Overlay */}
      {syncError && (
        <div className="bg-red-950/40 border-b border-red-500/20 px-4 py-2 text-center text-xs text-red-400 flex items-center justify-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          <span>Sync failed: {syncError}. Double check your API settings or rate limits.</span>
        </div>
      )}
    </header>
  );
}
