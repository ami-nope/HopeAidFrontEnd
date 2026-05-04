'use client';

import Link from 'next/link';
import React, { useState, useTransition } from 'react';
import {
  CloudLightning,
  CloudRain,
  Gauge,
  MapPin,
  ShieldAlert,
  Sparkles,
  Wind,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { InputField } from '@/components/ui/InputField';
import { ENDPOINTS } from '@/config/api';
import { apiFetch } from '@/lib/api-client';

type Severity = 'low' | 'medium' | 'high' | 'critical';
type RiskBand = 'clear' | 'watch' | 'elevated' | 'severe';

interface SimulatorResponse {
  success: boolean;
  data: {
    alert_id: string;
    organization_slug: string;
    location_name: string;
  };
}

const severityOptions: Severity[] = ['low', 'medium', 'high', 'critical'];
const riskBandOptions: RiskBand[] = ['clear', 'watch', 'elevated', 'severe'];

function ToggleCard({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`rounded-2xl border p-4 text-left transition ${
        value
          ? 'border-cyan-400 bg-cyan-50/90 shadow-[0_18px_45px_-30px_rgba(6,182,212,0.75)] dark:border-cyan-700 dark:bg-cyan-950/30'
          : 'border-slate-200 bg-white/85 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</div>
          <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</div>
        </div>
        <div
          className={`h-6 w-11 rounded-full p-1 transition ${
            value ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <div
            className={`h-4 w-4 rounded-full bg-white transition-transform ${
              value ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
      </div>
    </button>
  );
}

export default function SimulatorPage() {
  const [isPending, startTransition] = useTransition();
  const [locationName, setLocationName] = useState('Anna Nagar, Chennai');
  const [heading, setHeading] = useState('Cyclone spillover may slow response corridors');
  const [description, setDescription] = useState('Heavy rain bands and gusts could delay volunteer movement and community supply drops.');
  const [solution, setSolution] = useState('Stage kits nearer the zone, delay bike dispatch, and confirm road access before rollout.');
  const [severity, setSeverity] = useState<Severity>('high');
  const [riskBand, setRiskBand] = useState<RiskBand>('severe');
  const [rainProbability, setRainProbability] = useState('86');
  const [rainTotal, setRainTotal] = useState('44');
  const [windGust, setWindGust] = useState('58');
  const [warningCount, setWarningCount] = useState('2');
  const [dangerForCommunity, setDangerForCommunity] = useState(true);
  const [dangerOnVolunteers, setDangerOnVolunteers] = useState(true);
  const [canBeSolved, setCanBeSolved] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    startTransition(async () => {
      try {
        const response = await apiFetch<SimulatorResponse>(ENDPOINTS.publicSimulatorWeatherAlert, {
          method: 'POST',
          noAuth: true,
          body: {
            location_name: locationName,
            heading,
            description,
            solution,
            severity,
            risk_band: riskBand,
            danger_for_community: dangerForCommunity,
            danger_on_volunteers: dangerOnVolunteers,
            can_be_solved: canBeSolved,
            peak_precipitation_probability: Number(rainProbability),
            total_precipitation: Number(rainTotal),
            peak_wind_gust: Number(windGust),
            official_warning_count: Number(warningCount),
          },
        });

        setSuccess(
          `Injected alert ${response.data.alert_id.slice(0, 8)} into org "${response.data.organization_slug}" for ${response.data.location_name}.`,
        );
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Unable to create simulator alert');
      }
    });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.16),transparent_32%),linear-gradient(180deg,#f7fcff_0%,#eef7fb_48%,#f8fafc_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.16),transparent_30%),linear-gradient(180deg,#020617_0%,#08111f_48%,#020617_100%)] dark:text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-[32px] border border-cyan-200/70 bg-white/80 p-8 shadow-[0_35px_100px_-55px_rgba(6,182,212,0.6)] backdrop-blur-xl dark:border-cyan-900/40 dark:bg-slate-950/55">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/70 bg-cyan-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-700 dark:border-cyan-800/70 dark:bg-cyan-950/40 dark:text-cyan-200">
                <Sparkles size={12} className="animate-pulse" />
                Public Weather Simulator
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight">Inject a weather alert without logging in</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Choose a location, shape the weather stress, and push a simulated AI alert into the configured org so the admin alerts pipeline can be tested end to end.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="inline-flex items-center rounded-full border border-slate-300 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Back to login
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <Card className="border-cyan-100/80 bg-cyan-50/65 dark:border-cyan-900/40 dark:bg-cyan-950/20">
              <CardContent className="flex items-center gap-3 p-5">
                <MapPin className="text-cyan-600 dark:text-cyan-300" size={20} />
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Target</div>
                  <div className="mt-1 text-sm font-semibold">{locationName}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-cyan-100/80 bg-cyan-50/65 dark:border-cyan-900/40 dark:bg-cyan-950/20">
              <CardContent className="flex items-center gap-3 p-5">
                <CloudRain className="text-cyan-600 dark:text-cyan-300" size={20} />
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Rain Probability</div>
                  <div className="mt-1 text-sm font-semibold">{rainProbability}%</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-cyan-100/80 bg-cyan-50/65 dark:border-cyan-900/40 dark:bg-cyan-950/20">
              <CardContent className="flex items-center gap-3 p-5">
                <Wind className="text-cyan-600 dark:text-cyan-300" size={20} />
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Peak Gust</div>
                  <div className="mt-1 text-sm font-semibold">{windGust} km/h</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-cyan-100/80 bg-cyan-50/65 dark:border-cyan-900/40 dark:bg-cyan-950/20">
              <CardContent className="flex items-center gap-3 p-5">
                <ShieldAlert className="text-cyan-600 dark:text-cyan-300" size={20} />
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Risk Band</div>
                  <div className="mt-1 text-sm font-semibold capitalize">{riskBand}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/85 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/55">
            <CardHeader>
              <CardTitle>Scenario Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={submit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    label="Location"
                    value={locationName}
                    onChange={(event) => setLocationName(event.target.value)}
                    icon={<MapPin size={16} />}
                    placeholder="Eg. Anna Nagar, Chennai"
                    required
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Severity</label>
                    <select
                      className="block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      value={severity}
                      onChange={(event) => setSeverity(event.target.value as Severity)}
                    >
                      {severityOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Heading</label>
                  <input
                    className="block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    value={heading}
                    onChange={(event) => setHeading(event.target.value)}
                    placeholder="Short alert heading"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                    <textarea
                      className="block min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Solution</label>
                    <textarea
                      className="block min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      value={solution}
                      onChange={(event) => setSolution(event.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <InputField
                    label="Rain Probability %"
                    type="number"
                    min="0"
                    max="100"
                    value={rainProbability}
                    onChange={(event) => setRainProbability(event.target.value)}
                    icon={<CloudRain size={16} />}
                  />
                  <InputField
                    label="Rain Total mm"
                    type="number"
                    min="0"
                    value={rainTotal}
                    onChange={(event) => setRainTotal(event.target.value)}
                    icon={<CloudLightning size={16} />}
                  />
                  <InputField
                    label="Wind Gust km/h"
                    type="number"
                    min="0"
                    value={windGust}
                    onChange={(event) => setWindGust(event.target.value)}
                    icon={<Wind size={16} />}
                  />
                  <InputField
                    label="Official Warnings"
                    type="number"
                    min="0"
                    value={warningCount}
                    onChange={(event) => setWarningCount(event.target.value)}
                    icon={<Gauge size={16} />}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Risk Band</label>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {riskBandOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setRiskBand(option)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-medium capitalize transition ${
                          riskBand === option
                            ? 'border-cyan-500 bg-cyan-500 text-white shadow-[0_18px_45px_-28px_rgba(6,182,212,0.9)]'
                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <ToggleCard
                    label="Danger for community"
                    description="Should the alert show operational risk to affected people?"
                    value={dangerForCommunity}
                    onChange={setDangerForCommunity}
                  />
                  <ToggleCard
                    label="Danger on volunteers"
                    description="Should the alert show responder travel and safety risk?"
                    value={dangerOnVolunteers}
                    onChange={setDangerOnVolunteers}
                  />
                  <ToggleCard
                    label="Can be solved"
                    description="If on, the alert includes a visible mitigation plan."
                    value={canBeSolved}
                    onChange={setCanBeSolved}
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {success}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" size="lg" className="gap-2 rounded-full px-6" disabled={isPending}>
                    <Sparkles size={16} />
                    {isPending ? 'Injecting alert...' : 'Inject simulator alert'}
                  </Button>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    Non-authenticated route. Controlled by backend feature flag.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[28px] border border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/55">
              <CardHeader>
                <CardTitle>What this writes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <p>
                  The simulator creates a normal <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">weather_risk</code> alert in the configured organization. Admins will see it in the regular Alerts page.
                </p>
                <p>
                  Resolving it moves it into History. Activating it from History brings it back into Active Alerts.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/55">
              <CardHeader>
                <CardTitle>Suggested test flow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  1. Inject an alert here.
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  2. Open the admin Alerts page and confirm the one-line signal appears.
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  3. Expand it, resolve it, then switch to History and reactivate it.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
