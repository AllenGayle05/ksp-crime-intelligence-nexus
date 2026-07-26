import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Brain,
  Crosshair,
  Database,
  Fingerprint,
  Network,
  Radar,
  Radio,
  Shield,
  Siren,
  Target,
  Users,
} from "lucide-react";
import mapImg from "@/assets/karnataka-tactical-map.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KSP Crime Intelligence Nexus — Predictive Policing Platform" },
      {
        name: "description",
        content:
          "AI-powered crime intelligence, hotspot prediction, and investigation support for the Karnataka State Police.",
      },
      { property: "og:title", content: "KSP Crime Intelligence Nexus" },
      {
        property: "og:description",
        content:
          "Real-time intelligence dashboard for predictive policing across Karnataka districts.",
      },
    ],
  }),
  component: Dashboard,
});

const NAV = ["Intelligence", "Analytics", "Operations", "Reports"] as const;

function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t.toUTCString().slice(17, 25);
}

function Dashboard() {
  const clock = useClock();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent-primary/30 ksp-grid-bg">
      {/* HEADER */}
      <header className="sticky top-0 z-50 h-14 border-b border-border bg-navy-900/85 backdrop-blur-xl flex items-center justify-between px-5">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded bg-accent-primary/10 ring-1 ring-accent-primary/40 grid place-items-center">
              <Shield className="size-4 text-accent-primary" strokeWidth={2.4} />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-tight">
                KSP <span className="text-accent-primary">NEXUS</span>
              </div>
              <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Crime Intelligence · v4.2
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded border border-status-critical/40 bg-status-critical/10">
            <span className="size-1.5 rounded-full bg-status-critical animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-status-critical">
              Classified · Level 5
            </span>
          </div>
        </div>

        <div className="flex items-center gap-7">
          <nav className="flex items-center gap-6">
            {NAV.map((n, i) => (
              <a
                key={n}
                href="#"
                className={`text-[13px] font-medium tracking-tight transition-colors ${
                  i === 0
                    ? "text-accent-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {n}
              </a>
            ))}
          </nav>
          <button className="flex items-center gap-1.5 bg-accent-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded ring-1 ring-accent-primary/60 hover:brightness-110 transition active:scale-[0.98]">
            <Crosshair className="size-3.5" />
            DEPLOY UNIT
          </button>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="grid grid-cols-[280px_1fr_320px] h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* LEFT RAIL */}
        <aside className="border-r border-border bg-navy-900/40 overflow-y-auto">
          {/* AI Predictions */}
          <section className="p-4 border-b border-border">
            <SectionLabel icon={<Brain className="size-3" />} label="AI Prediction Engine" />
            <p className="text-[10px] text-muted-foreground mt-1 mb-4">
              24h probabilistic forecast · GNN-v3
            </p>
            <div className="space-y-3.5">
              <PredictionBar label="Property Theft" value={92} target="BLR Central" />
              <PredictionBar label="Cyber Intrusion" value={67} target="Tech Corridor" tone="secondary" />
              <PredictionBar label="Civil Unrest" value={42} target="Belagavi" tone="warning" />
              <PredictionBar label="Trafficking" value={28} target="Coastal Belt" tone="muted" />
            </div>
          </section>

          {/* District threat matrix */}
          <section className="p-4 border-b border-border">
            <SectionLabel icon={<Target className="size-3" />} label="District Threat Matrix" />
            <div className="mt-3 space-y-1.5">
              <DistrictRow name="Bengaluru Urban" level="CRIT" delta="+8%" />
              <DistrictRow name="Mysuru" level="STBL" delta="−2%" />
              <DistrictRow name="Hubballi-Dharwad" level="WARN" delta="+3%" />
              <DistrictRow name="Mangaluru" level="STBL" delta="−1%" />
              <DistrictRow name="Belagavi" level="WARN" delta="+5%" />
              <DistrictRow name="Kalaburagi" level="STBL" delta="0%" />
            </div>
          </section>

          {/* FIR throughput */}
          <section className="p-4">
            <SectionLabel icon={<Database className="size-3" />} label="FIR Throughput · 7d" />
            <div className="mt-3 flex items-end gap-1 h-20">
              {[55, 72, 48, 88, 62, 95, 70].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-accent-primary/70 rounded-t-sm"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[8px] font-mono text-muted-foreground">
                    {["M", "T", "W", "T", "F", "S", "S"][i]}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>TOTAL</span>
              <span className="text-foreground">84,219 FIRs</span>
            </div>
          </section>
        </aside>

        {/* CENTER COLUMN */}
        <section className="flex flex-col bg-navy-950 min-w-0">
          {/* KPI strip */}
          <div className="grid grid-cols-5 border-b border-border bg-navy-900/60">
            <Kpi label="Active Incidents" value="1,402" trend="+12" />
            <Kpi label="Predicted Hotspots" value="42" trend="+6" accent />
            <Kpi label="Response Time" value="4.2m" trend="−0.4m" ok />
            <Kpi label="Patrol Density" value="88%" trend="+2%" />
            <Kpi label="Risk Index" value="7.4" trend="+0.3" warn last />
          </div>

          {/* Map + overlays */}
          <div className="relative flex-1 overflow-hidden border-b border-border">
            <img
              src={mapImg}
              alt="Karnataka tactical heatmap"
              width={1920}
              height={1080}
              className="absolute inset-0 w-full h-full object-cover opacity-70"
            />
            {/* radar sweep */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[520px] rounded-full animate-ksp-radar pointer-events-none mix-blend-screen opacity-60" />
            {/* concentric rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[520px] rounded-full border border-accent-primary/15 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[340px] rounded-full border border-accent-primary/15 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[180px] rounded-full border border-accent-primary/20 pointer-events-none" />

            {/* Map header chip */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-2.5 py-1.5 rounded bg-navy-900/80 backdrop-blur ring-1 ring-border">
              <Radar className="size-3.5 text-accent-primary" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Geospatial Intel · KA-DISTRICTS
              </span>
              <span className="text-[10px] font-mono text-accent-primary">14:22:09 UTC</span>
              <span className="text-[10px] font-mono text-foreground/80">{clock}</span>
            </div>

            {/* Live prediction card */}
            <div className="absolute top-4 right-4 w-64 p-3 rounded-lg bg-navy-900/85 backdrop-blur-xl ring-1 ring-border shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="size-1.5 rounded-full bg-accent-primary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent-primary">
                  Live Prediction
                </span>
              </div>
              <p className="text-xs leading-snug text-foreground/90">
                Cluster formation probability <span className="text-accent-primary font-semibold">87%</span>{" "}
                in Koramangala Block 4 within 15 minutes.
              </p>
              <button className="mt-3 w-full text-[10px] font-semibold uppercase tracking-widest py-1.5 rounded bg-accent-primary/10 ring-1 ring-accent-primary/40 text-accent-primary hover:bg-accent-primary/20 transition flex items-center justify-center gap-1">
                Reroute Patrol <ArrowUpRight className="size-3" />
              </button>
            </div>

            {/* Hotspots */}
            <Hotspot top="42%" left="48%" tone="critical" label="ALPHA-7" />
            <Hotspot top="58%" left="62%" tone="warning" label="DELTA-3" />
            <Hotspot top="34%" left="68%" tone="accent" label="ECHO-9" />
            <Hotspot top="68%" left="38%" tone="warning" label="BRAVO-2" />

            {/* Bottom legend */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-4 px-3 py-1.5 rounded bg-navy-900/80 backdrop-blur ring-1 ring-border text-[10px] font-mono uppercase tracking-widest">
                <LegendDot color="status-critical" label="Critical" />
                <LegendDot color="status-warning" label="Warning" />
                <LegendDot color="accent-primary" label="Active" />
                <LegendDot color="muted-foreground" label="Stable" />
              </div>
              <div className="flex items-center gap-3 px-3 py-1.5 rounded bg-navy-900/80 backdrop-blur ring-1 ring-border text-[10px] font-mono">
                <span className="text-muted-foreground">UNITS</span>
                <span className="text-foreground font-semibold">112</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">DRONES</span>
                <span className="text-accent-primary font-semibold">14</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">SAT</span>
                <span className="text-status-ok font-semibold">LOCKED</span>
              </div>
            </div>
          </div>

          {/* Ticker */}
          <div className="h-9 border-t border-border bg-navy-900 flex items-center overflow-hidden shrink-0">
            <div className="shrink-0 h-full px-3 flex items-center gap-1.5 bg-accent-primary/10 border-r border-border">
              <Radio className="size-3 text-accent-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent-primary">
                Live Intel
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="inline-flex whitespace-nowrap animate-ksp-marquee gap-12 pl-6 text-[11px] font-mono">
                {[...Array(2)].map((_, k) => (
                  <span key={k} className="inline-flex gap-12">
                    <span className="text-accent-secondary">[14:22] UNIT-04 DEPLOYED · JAYANAGAR</span>
                    <span className="text-muted-foreground">SIGINT: ENCRYPTED UPLINK · SECTOR 7</span>
                    <span className="text-status-warning">ALERT: CROWD DENSITY ANOMALY · METRO STN B</span>
                    <span className="text-foreground/80">FACIAL MATCH FOUND · CASE ID-884-X</span>
                    <span className="text-accent-primary">PREDICTIVE MODEL RETRAINED · 2.4M FIRs</span>
                    <span className="text-status-critical">PURSUIT ACTIVE · PL8 449-XTZ</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT RAIL */}
        <aside className="border-l border-border bg-navy-900/40 flex flex-col overflow-hidden">
          {/* Intel Feed */}
          <section className="p-4 border-b border-border overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel icon={<Siren className="size-3" />} label="Intelligence Feed" />
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-accent-primary">
                <span className="size-1.5 rounded-full bg-accent-primary animate-pulse" />
                LIVE
              </span>
            </div>
            <div className="space-y-3">
              <FeedItem
                tone="critical"
                time="04:12 PM"
                title="UAV signature in restricted airspace"
                body="Unidentified drone north of HAL airport perimeter. Auto-intercept queued."
              />
              <FeedItem
                tone="warning"
                time="04:08 PM"
                title="Sentiment spike · Belagavi"
                body="Social signals suggest localized assembly forming near district HQ."
              />
              <FeedItem
                tone="accent"
                time="03:55 PM"
                title="LPR hit · BOLO #144"
                body="Plate MH-02-AX-4421 matches active investigation vector."
              />
              <FeedItem
                tone="muted"
                time="03:42 PM"
                title="Patrol UNIT-12 perimeter secure"
                body="Routine sweep at Vidhana Soudha returned all-clear."
              />
            </div>
          </section>

          {/* Investigation support */}
          <section className="p-4 border-b border-border">
            <SectionLabel icon={<Fingerprint className="size-3" />} label="Investigation Support" />
            <div className="mt-3 space-y-2">
              <SupportCard
                icon={<Network className="size-3.5" />}
                title="Link Analysis"
                desc="Map suspect network across 12 entities."
              />
              <SupportCard
                icon={<Database className="size-3.5" />}
                title="Query Vector DB"
                desc="MO pattern match across 84k FIRs."
              />
              <SupportCard
                icon={<Activity className="size-3.5" />}
                title="Forensic Audit"
                desc="Priority compute · Case #901 transaction trace."
                highlight
              />
            </div>
          </section>

          {/* Cognitive nexus */}
          <section className="p-4 mt-auto bg-gradient-to-br from-accent-primary/10 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="size-3.5 text-accent-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent-primary">
                Cognitive Nexus
              </span>
            </div>
            <p className="text-xs text-foreground/85 leading-snug">
              Reroute 3 units from Station-B to West Corridor — sensor anomaly correlation up{" "}
              <span className="text-accent-primary font-semibold">+34%</span>.
            </p>
            <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="size-3" /> 3 units · ETA 4.1m
              </span>
              <button className="text-accent-primary font-semibold uppercase tracking-widest hover:underline">
                Approve →
              </button>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span className="text-accent-primary">{icon}</span>
      <h2 className="text-[10px] font-bold uppercase tracking-[0.18em]">{label}</h2>
    </div>
  );
}

function PredictionBar({
  label,
  value,
  target,
  tone = "primary",
}: {
  label: string;
  value: number;
  target: string;
  tone?: "primary" | "secondary" | "warning" | "muted";
}) {
  const color =
    tone === "warning"
      ? "bg-status-warning"
      : tone === "secondary"
        ? "bg-accent-secondary"
        : tone === "muted"
          ? "bg-muted-foreground"
          : "bg-accent-primary";
  const textColor =
    tone === "warning"
      ? "text-status-warning"
      : tone === "secondary"
        ? "text-accent-secondary"
        : tone === "muted"
          ? "text-muted-foreground"
          : "text-accent-primary";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-foreground/90">{label}</span>
        <span className={`text-[11px] font-mono ${textColor}`}>{value}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        ⟶ {target}
      </div>
    </div>
  );
}

function DistrictRow({
  name,
  level,
  delta,
}: {
  name: string;
  level: "CRIT" | "WARN" | "STBL";
  delta: string;
}) {
  const tone =
    level === "CRIT"
      ? "bg-status-critical/15 text-status-critical border-status-critical/30"
      : level === "WARN"
        ? "bg-status-warning/15 text-status-warning border-status-warning/30"
        : "bg-status-ok/10 text-status-ok border-status-ok/25";
  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-white/5 transition-colors">
      <span className="text-xs text-foreground/90">{name}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-muted-foreground">{delta}</span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-wider ${tone}`}
        >
          {level}
        </span>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  trend,
  accent,
  warn,
  ok,
  last,
}: {
  label: string;
  value: string;
  trend: string;
  accent?: boolean;
  warn?: boolean;
  ok?: boolean;
  last?: boolean;
}) {
  const c = accent
    ? "text-accent-primary"
    : warn
      ? "text-status-warning"
      : ok
        ? "text-status-ok"
        : "text-foreground";
  return (
    <div className={`p-3 ${!last ? "border-r border-border" : ""}`}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="flex items-baseline gap-2 mt-0.5">
        <span className={`text-2xl font-semibold tracking-tight ${c}`}>{value}</span>
        <span className="text-[10px] font-mono text-muted-foreground">{trend}</span>
      </div>
    </div>
  );
}

function Hotspot({
  top,
  left,
  tone,
  label,
}: {
  top: string;
  left: string;
  tone: "critical" | "warning" | "accent";
  label: string;
}) {
  const dot =
    tone === "critical"
      ? "bg-status-critical"
      : tone === "warning"
        ? "bg-status-warning"
        : "bg-accent-primary";
  const ring =
    tone === "critical"
      ? "bg-status-critical/30"
      : tone === "warning"
        ? "bg-status-warning/30"
        : "bg-accent-primary/30";
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 group" style={{ top, left }}>
      <div className="relative grid place-items-center">
        <div className={`absolute size-8 rounded-full ${ring} animate-ksp-ping`} />
        <div className={`size-2.5 rounded-full ${dot} ring-2 ring-background/60 shadow-lg`} />
        <div className="absolute top-4 left-3 px-1.5 py-0.5 rounded bg-navy-900/90 backdrop-blur ring-1 ring-border text-[9px] font-mono uppercase tracking-widest text-foreground/90 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
          {label}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="size-1.5 rounded-full" style={{ backgroundColor: `var(--color-${color})` }} />
      {label}
    </span>
  );
}

function FeedItem({
  tone,
  time,
  title,
  body,
}: {
  tone: "critical" | "warning" | "accent" | "muted";
  time: string;
  title: string;
  body: string;
}) {
  const border =
    tone === "critical"
      ? "border-status-critical/50"
      : tone === "warning"
        ? "border-status-warning/50"
        : tone === "accent"
          ? "border-accent-primary/50"
          : "border-border";
  const timeColor =
    tone === "critical"
      ? "text-status-critical"
      : tone === "warning"
        ? "text-status-warning"
        : tone === "accent"
          ? "text-accent-primary"
          : "text-muted-foreground";
  return (
    <div className={`pl-3 border-l-2 ${border}`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className={`text-[10px] font-mono uppercase tracking-wider ${timeColor}`}>{time}</span>
        {tone === "critical" && <AlertTriangle className="size-3 text-status-critical" />}
      </div>
      <div className="text-[12px] font-semibold text-foreground leading-snug">{title}</div>
      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{body}</p>
    </div>
  );
}

function SupportCard({
  icon,
  title,
  desc,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  highlight?: boolean;
}) {
  return (
    <button
      className={`w-full text-left p-2.5 rounded ring-1 transition group ${
        highlight
          ? "bg-accent-primary/10 ring-accent-primary/40 hover:bg-accent-primary/15"
          : "bg-navy-900/60 ring-border hover:ring-accent-primary/40"
      }`}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span className={highlight ? "text-accent-primary" : "text-foreground/80"}>{icon}</span>
        <span
          className={`text-xs font-semibold ${
            highlight ? "text-accent-primary" : "text-foreground"
          }`}
        >
          {title}
        </span>
      </div>
      <p
        className={`text-[10px] leading-snug ${
          highlight ? "text-accent-primary/80" : "text-muted-foreground"
        }`}
      >
        {desc}
      </p>
    </button>
  );
}
