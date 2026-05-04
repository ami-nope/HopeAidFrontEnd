'use client';

import React, { useId, useState } from 'react';
import { AlertTriangle, CloudRain, ShieldAlert, ShieldCheck, Wind, CheckCircle2, AlertCircle } from 'lucide-react';

import type { AlertItem } from '@/hooks/useData';

import { Badge } from './ui/Badge';

function decisionBadge(
  value: boolean | undefined,
  truthyLabel: string,
  falsyLabel: string,
  truthyVariant: 'success' | 'warning' | 'danger' | 'info' | 'default' = 'danger',
  falsyVariant: 'success' | 'warning' | 'danger' | 'info' | 'default' = 'default',
) {
  return (
    <Badge
      variant={value ? truthyVariant : falsyVariant}
      className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
    >
      {value ? (
        <span className="flex items-center gap-1.5">
          {truthyVariant === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {truthyLabel}
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          {falsyVariant === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {falsyLabel}
        </span>
      )}
    </Badge>
  );
}

function providerEntries(providers?: Record<string, unknown> | null) {
  return Object.entries(providers || {}).filter(([, value]) => value);
}

function metricValue(value: unknown, suffix = '') {
  if (typeof value === 'number') return `${value}${suffix}`;
  if (typeof value === 'string' && value) return `${value}${suffix}`;
  return '-';
}

function AiLogo({ className = '' }: { className?: string }) {
  const rawId = useId();
  const safeId = rawId.replace(/:/g, '');
  const textId = `ai-text-${safeId}`;
  const sparkleId = `ai-sparkle-${safeId}`;

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={textId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id={sparkleId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      <g fill={`url(#${sparkleId})`}>
        <polygon points="12,8 14,14 20,16 14,18 12,24 10,18 4,16 10,14" />
        <polygon points="23,6 24.5,9.5 28,11 24.5,12.5 23,16 21.5,12.5 18,11 21.5,9.5" />
        <polygon points="6,24 7.5,27 11,28 7.5,29 6,32 4.5,29 1,28 4.5,27" />
      </g>
      <text
        x="30"
        y="31"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        letterSpacing="0.04em"
        fill={`url(#${textId})`}
        style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
      >
        AI
      </text>
    </svg>
  );
}

export function AlertIntelligencePanel({ alert }: { alert: AlertItem }) {
  const metadata = alert.metadata_json || null;
  const weather = metadata?.weather || {};
  const providers = providerEntries(metadata?.providers);
  const decisions = metadata?.decisions || {};
  const [showSources, setShowSources] = useState(false);
  const defaultSources: Array<[string, string]> = [
    ['llm', 'gemini-2.5-flash-lite'],
    ['forecast', 'open_meteo'],
    ['warnings', 'none'],
    ['geocoding', 'open_meteo'],
  ];
  const sourceItems = providers.length > 0
    ? providers.map(([key, value]) => [String(key), String(value)] as [string, string])
    : defaultSources;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#09090b]">
      {/* Top subtle AI gradient bar */}
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
      
      <div className="p-6 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4 max-w-3xl">
            <div>
              <h4 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {metadata?.heading || alert.title}
              </h4>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                {metadata?.full_text || metadata?.description || alert.message}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <Badge
              variant={
                alert.severity === 'critical' || alert.severity === 'high'
                  ? 'danger'
                  : alert.severity === 'medium'
                    ? 'warning'
                    : 'info'
              }
              className="px-3 py-1.5 text-xs font-medium"
            >
              {metadata?.risk_band || alert.severity}
            </Badge>
            <div className="inline-flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
              {new Date(alert.created_at).toLocaleString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>

        {/* Decisions Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <ShieldAlert size={14} className="text-rose-500" />
              Community Impact
            </div>
            <div className="mt-3">
              {decisionBadge(decisions.danger_for_community, 'Risk Confirmed', 'Risk Low', 'danger', 'success')}
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <ShieldCheck size={14} className="text-amber-500" />
              Volunteer Safety
            </div>
            <div className="mt-3">
              {decisionBadge(decisions.danger_on_volunteers, 'Safety Risk', 'Clear', 'warning', 'success')}
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <AiLogo className="h-7 w-7 shrink-0" />
              <span className="leading-none">Response Readiness</span>
            </div>
            <div className="mt-3">
              {decisionBadge(decisions.can_be_solved, 'Actionable', 'Needs Escalation', 'success', 'warning')}
            </div>
          </div>
        </div>

        {/* Detailed Info Layout */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* AI Summary & Recommendation Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-200">
                <AlertTriangle size={16} className="text-indigo-500" />
                AI Analysis Summary
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {metadata?.description || alert.message}
              </p>
            </div>
            
            {metadata?.solution && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                  <CheckCircle2 size={16} />
                  Recommended Response
                </div>
                <p className="mt-2 text-sm leading-relaxed text-emerald-700 dark:text-emerald-300">
                  {metadata.solution}
                </p>
              </div>
            )}
          </div>

          {/* Weather & Providers Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-200">
                <CloudRain size={16} className="text-blue-500" />
                Weather Signals
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/50 dark:bg-slate-900/50">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Rain Prob</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {metricValue(weather.peak_precipitation_probability, '%')}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/50 dark:bg-slate-900/50">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Rain Total</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {metricValue(weather.total_precipitation, 'mm')}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <Wind size={12} />
                    Gusts
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {metricValue(weather.peak_wind_gust, ' km/h')}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/50 dark:bg-slate-900/50">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Warnings</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {metricValue(weather.official_warning_count)}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowSources((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
                aria-expanded={showSources}
                aria-controls="alert-data-sources"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">i</span>
                Data sources
              </button>

              {showSources && (
                <div id="alert-data-sources" className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Data Sources</div>
                  {sourceItems.map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="min-w-[90px] text-xs font-semibold uppercase tracking-wider text-slate-400">{key}:</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
