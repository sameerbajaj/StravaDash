'use client';

import { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsHero from '@/components/dashboard/StatsHero';
import FitnessChart from '@/components/dashboard/FitnessChart';
import TrainingZones from '@/components/dashboard/TrainingZones';
import BestEfforts from '@/components/dashboard/BestEfforts';
import Predictions from '@/components/dashboard/Predictions';
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap';
import RecentActivities from '@/components/dashboard/RecentActivities';
import { ActivityData, FitnessDay, BestEffort, Prediction } from '@/lib/strava-calculations';
import { Flame, ShieldAlert, KeyRound, ExternalLink, ArrowRight } from 'lucide-react';

interface Athlete {
  id: number;
  username: string | null;
  firstname: string;
  lastname: string;
  profile: string | null;
}

interface DashboardMetrics {
  ytdDistance: number;
  yearlyGoal: number;
  recentActivities: ActivityData[];
  bestEfforts: Record<string, BestEffort | null>;
  predictions: Prediction[];
  fitnessTimeline: FitnessDay[];
  hrDistribution: {
    distribution: Record<string, number>;
    percentages: Record<string, number>;
    totalSeconds: number;
  };
}

export default function DashboardHome() {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [isOauthConfigured, setIsOauthConfigured] = useState(true);

  // Fetch OAuth authorization URL
  useEffect(() => {
    fetch('/api/auth/strava-url')
      .then(res => res.json())
      .then(data => {
        if (data.configured) {
          setOauthUrl(data.url);
          setIsOauthConfigured(true);
        } else {
          setIsOauthConfigured(false);
        }
      })
      .catch(err => console.error('Error fetching OAuth URL:', err));
  }, []);

  // Fetch Athlete metrics (hoisted)
  async function fetchDashboardData(useDemo: boolean) {
    setLoading(true);
    setErrorMsg(null);
    try {
      const url = useDemo ? '/api/athlete?demo=true' : '/api/athlete';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to retrieve athlete performance metrics.');
      }
      const data = await res.json();
      setAthlete(data.athlete);
      setMetrics(data.metrics);
      setIsDemo(data.isDemo || useDemo);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Database communication failed.');
      // Auto fallback to demo if disconnected
      if (!useDemo) {
        handleToggleDemo();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial fetch (checks if session cookie is active, falls back to demo mode if not connected)
    fetch('/api/athlete')
      .then(async res => {
        if (res.ok) {
          const data = await res.json();
          if (data.athlete && data.metrics.recentActivities.length > 0 && !data.isDemo) {
            setAthlete(data.athlete);
            setMetrics(data.metrics);
            setIsDemo(false);
            setLoading(false);
          } else {
            // Default load demo for visual experience
            fetchDashboardData(true);
          }
        } else {
          fetchDashboardData(true);
        }
      })
      .catch(() => {
        fetchDashboardData(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = async () => {
    const res = await fetch('/api/sync', { method: 'POST' });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Incremental sync timed out.');
    }
    // Refresh dashboard calculations
    await fetchDashboardData(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAthlete(null);
    setMetrics(null);
    // Reload into Demo mode
    fetchDashboardData(true);
  };

  function handleToggleDemo() {
    if (isDemo) {
      // Try reloading actual data
      fetchDashboardData(false);
    } else {
      fetchDashboardData(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-text-muted tracking-wider">
          Loading performance data…
        </p>
        {errorMsg && <p className="text-[10px] text-accent-danger">{errorMsg}</p>}
      </div>
    );
  }

  const showDashboard = athlete && metrics && (metrics.recentActivities.length > 0 || isDemo);

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <DashboardHeader
        athlete={athlete}
        isDemo={isDemo}
        onSync={handleSync}
        onToggleDemo={handleToggleDemo}
        onLogout={handleLogout}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Landing Screen / Disconnected State Promo Card */}
        {(!showDashboard || (athlete?.id === 0 && isDemo)) && (
          <section className="dash-card p-8 md:p-12 text-center max-w-2xl mx-auto my-12 relative">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-accent-warm-muted border border-accent-warm/20 text-accent-warm mb-6">
              <Flame className="h-6 w-6" />
            </div>

            <h2 className="font-display text-2xl md:text-3xl text-text-primary">
              Your running performance,
              <br />
              <span className="text-accent-warm">decoded.</span>
            </h2>
            
            <p className="text-sm text-text-secondary mt-4 max-w-md mx-auto leading-relaxed">
              Unlock elite-level running analytics: fitness progression curves, polarized heart-rate zone ratios, race finish-time predictions, and consistency profiling.
            </p>

            {/* Connection Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {oauthUrl ? (
                <a
                  href={oauthUrl}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-accent-warm hover:bg-accent-warm/90 font-mono font-semibold text-xs text-text-inverse tracking-wide transition-all flex items-center justify-center space-x-2"
                >
                  <span>Connect with Strava</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <div className="w-full sm:w-auto px-6 py-3 rounded-lg bg-accent-danger/10 border border-accent-danger/20 text-accent-danger font-mono text-[11px] tracking-wide flex items-center space-x-2">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Server API keys missing</span>
                </div>
              )}

              <button
                onClick={() => fetchDashboardData(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-border-primary hover:border-border-hover text-text-secondary hover:text-accent-warm transition-all text-xs font-mono tracking-wide flex items-center justify-center space-x-2"
              >
                <span>Explore Demo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Info panel if server keys are missing */}
            {!isOauthConfigured && (
              <div className="mt-8 border border-border-primary bg-bg-elevated p-4 rounded-lg text-left text-[11px] font-mono text-text-secondary space-y-2">
                <div className="flex items-center space-x-2 text-accent-cool">
                  <KeyRound className="h-4 w-4" />
                  <span className="font-bold">Setup Instructions</span>
                </div>
                <p className="leading-relaxed">
                  To sync your own runs, copy <code className="text-text-primary bg-bg-card px-1 py-0.5 rounded">. env.example</code> to <code className="text-text-primary bg-bg-card px-1 py-0.5 rounded">.env</code> and fill in your <strong className="text-text-primary">STRAVA_CLIENT_ID</strong> and <strong className="text-text-primary">STRAVA_CLIENT_SECRET</strong> from the Strava developer site.
                </p>
                <a 
                  href="https://www.strava.com/settings/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-accent-warm hover:underline flex items-center gap-1 mt-1 text-[10px]"
                >
                  <span>Register Strava API App</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </section>
        )}

        {/* Dashboard Grid View */}
        {showDashboard && metrics && (
          <div className="space-y-8 animate-stagger">
            
            {/* Demo Header Notification Banner */}
            {isDemo && (
              <div className="bg-accent-warm-muted border border-accent-warm/20 text-accent-warm px-4 py-3 rounded-lg flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <Flame className="h-4 w-4" />
                  <span>Demo mode — viewing synthetic data. Connect Strava for your personal analytics.</span>
                </div>
                {oauthUrl && (
                  <a
                    href={oauthUrl}
                    className="underline hover:text-text-primary font-semibold ml-4 whitespace-nowrap"
                  >
                    Connect
                  </a>
                )}
              </div>
            )}

            {/* 1. Summary Cards */}
            <StatsHero
              ytdDistance={metrics.ytdDistance}
              yearlyGoal={metrics.yearlyGoal}
              activities={metrics.recentActivities}
            />

            {/* 2. Fitness Curve Timeline & Performance Projections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <FitnessChart timeline={metrics.fitnessTimeline} />
              </div>
              <div>
                <Predictions predictions={metrics.predictions} />
              </div>
            </div>

            {/* 3. Training Zones Polarization & Consistency Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <TrainingZones hrDistribution={metrics.hrDistribution} />
              </div>
              <div className="lg:col-span-2">
                <ActivityHeatmap activities={metrics.recentActivities} />
              </div>
            </div>

            {/* 4. Best Efforts Record Panels */}
            <BestEfforts bestEfforts={metrics.bestEfforts} />

            {/* 5. Detailed Logs Table */}
            <RecentActivities activities={metrics.recentActivities} />

          </div>
        )}
      </main>

      <footer className="border-t border-border-primary bg-bg-card/60 py-6 text-center text-[10px] font-mono text-text-muted select-none">
        <p className="tracking-wide">StravaDash — Built with Next.js & Prisma</p>
        <p className="mt-1 text-text-muted/50">All calculations conform to physiological running models.</p>
      </footer>
    </div>
  );
}
