'use client';

import { useState } from 'react';
import { RefreshCw, LogOut, ShieldAlert, Sun, Moon, Download, FileSpreadsheet } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

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
  const { theme, toggleTheme } = useTheme();

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
    <header className="border-b border-border-primary bg-bg-card/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-accent-warm flex items-center justify-center font-mono font-bold text-text-inverse text-sm tracking-tight">
            SD
          </div>
          <div>
            <h1 className="text-base font-display text-text-primary flex items-center gap-2">
              StravaDash
              <span className="badge">Analytics</span>
            </h1>
            <p className="text-[10px] text-text-muted font-mono tracking-wide">
              Running Performance Hub
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-border-primary hover:border-border-hover bg-bg-elevated text-text-secondary hover:text-accent-warm transition-all"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Demo Toggle */}
          <button
            onClick={onToggleDemo}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-all ${
              isDemo
                ? 'bg-accent-warm-muted border-accent-warm/30 text-accent-warm hover:bg-accent-warm/20'
                : 'border-border-primary text-text-muted hover:text-text-primary hover:border-border-hover'
            }`}
          >
            {isDemo ? 'DEMO' : 'LOAD DEMO'}
          </button>

          {/* Athlete Profile */}
          {athlete && (
            <div className="flex items-center space-x-3 border-l border-border-primary pl-3">
              <div className="relative">
                {athlete.profile ? (
                  <img
                    src={athlete.profile}
                    alt={athlete.firstname}
                    className="h-8 w-8 rounded-full border border-border-primary object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full border border-border-primary bg-bg-elevated flex items-center justify-center text-xs font-semibold text-text-primary">
                    {athlete.firstname[0]}
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-bg-card ${isDemo ? 'bg-accent-amber' : 'bg-accent-emerald'}`} />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-medium text-text-primary">
                  {athlete.firstname} {athlete.lastname}
                </p>
                <p className="text-[10px] text-text-muted font-mono">
                  {athlete.id === 0 ? 'Demo' : `#${athlete.id}`}
                </p>
              </div>

              {/* Sync Trigger */}
              {!isDemo && athlete.id !== 0 && (
                <button
                  onClick={handleSyncClick}
                  disabled={syncing}
                  className={`p-2 rounded-lg border border-border-primary hover:border-border-hover bg-bg-elevated text-text-secondary hover:text-accent-cool transition-all disabled:opacity-50 ${syncing ? 'animate-spin text-accent-cool' : ''}`}
                  title="Sync with Strava"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}

              {/* Export CSV */}
              <a
                href={`/api/export?format=csv${isDemo ? '&demo=true' : ''}`}
                className="p-2 rounded-lg border border-border-primary hover:border-border-hover bg-bg-elevated text-text-secondary hover:text-accent-warm transition-all flex items-center justify-center"
                title="Export all activities as CSV"
                download
              >
                <FileSpreadsheet className="h-4 w-4" />
              </a>

              {/* Export JSON Backup */}
              <a
                href={`/api/export?format=json${isDemo ? '&demo=true' : ''}`}
                className="p-2 rounded-lg border border-border-primary hover:border-border-hover bg-bg-elevated text-text-secondary hover:text-accent-warm transition-all flex items-center justify-center"
                title="Export raw data as JSON (Backup)"
                download
              >
                <Download className="h-4 w-4" />
              </a>

              {/* Disconnect / Logout */}
              <button
                onClick={onLogout}
                className="p-2 rounded-lg border border-border-primary hover:border-accent-danger/30 bg-bg-elevated text-text-secondary hover:text-accent-danger transition-all"
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
        <div className="bg-accent-danger/10 border-b border-accent-danger/20 px-4 py-2 text-center text-xs text-accent-danger flex items-center justify-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          <span>Sync failed: {syncError}. Double check your API settings or rate limits.</span>
        </div>
      )}
    </header>
  );
}
