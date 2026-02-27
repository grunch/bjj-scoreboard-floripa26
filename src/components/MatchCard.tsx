import { useEffect, useState } from 'react';
import { MatchEvent } from '@/hooks/useMatches';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock } from 'lucide-react';

function formatTime(seconds: number) {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Returns contrast color (black or white) for a given hex background. */
function contrastText(hex: string | undefined, fallbackDark = true): string {
  if (!hex || hex.length < 7) return fallbackDark ? '#121A2E' : '#FFFFFF';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Relative luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#121A2E' : '#FFFFFF';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'in-progress':
      return (
        <Badge className="bg-[#1BA34E] text-white gap-1 text-[10px]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
          </span>
          LIVE
        </Badge>
      );
    case 'waiting':
      return <Badge variant="secondary" className="gap-1 text-[10px]"><Clock className="h-2.5 w-2.5" /> Waiting</Badge>;
    case 'finished':
      return <Badge variant="outline" className="gap-1 text-[10px] border-white/30 text-white/80"><Trophy className="h-2.5 w-2.5" /> Finished</Badge>;
    case 'canceled':
      return <Badge variant="outline" className="gap-1 text-[10px] border-white/30 text-white/50">Canceled</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

function useElapsed(match: MatchEvent) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (match.status !== 'in-progress') return;
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, [match.status]);

  if (match.status !== 'in-progress' || !match.start_at) return null;

  const elapsed = now - match.start_at;
  const remaining = match.duration - elapsed;
  return { elapsed, remaining };
}

export default function MatchCard({ match, onOpen }: { match: MatchEvent; onOpen: (id: string) => void }) {
  const f1Score = match.f1_pt2 * 2 + match.f1_pt3 * 3 + match.f1_pt4 * 4;
  const f2Score = match.f2_pt2 * 2 + match.f2_pt3 * 3 + match.f2_pt4 * 4;

  const isLive = match.status === 'in-progress';
  const f1Winning = f1Score > f2Score;
  const f2Winning = f2Score > f1Score;

  const timer = useElapsed(match);

  const f1Text = contrastText(match.f1_color);
  const f2Text = contrastText(match.f2_color, false);

  // Gold and penalty colors from style guide
  const advColor = '#F5B800'; // Championship Gold
  const penColor = '#C0392B'; // Penalty red (muted)

  return (
    <div
      className={`
        group relative cursor-pointer rounded-xl overflow-hidden
        transition-all duration-300 shadow-md
        hover:shadow-xl hover:-translate-y-0.5
        ${isLive ? 'animate-glow-green ring-1 ring-[#1BA34E]/30' : 'ring-1 ring-border hover:ring-[#1BA34E]/20'}
      `}
      onClick={() => onOpen(match.id)}
    >
      {/* ── Top bar: dark background, timer center, names sides ── */}
      <div className="bg-[#121A2E] px-4 py-3 flex items-center justify-between gap-2">
        {/* Fighter 1 name */}
        <span className="text-sm font-bold text-white truncate flex-1">{match.f1_name}</span>

        {/* Center: timer + status */}
        <div className="flex flex-col items-center shrink-0 px-4">
          {isLive && timer ? (
            <span className={`text-2xl font-bold font-mono tracking-wider ${
              timer.remaining <= 30 ? 'text-[#F5B800] animate-pulse-live' : 'text-white'
            }`}>
              {formatTime(Math.max(0, timer.remaining))}
            </span>
          ) : match.status === 'waiting' ? (
            <span className="text-2xl font-bold font-mono tracking-wider text-white/60">{formatTime(match.duration)}</span>
          ) : (
            <span className="text-lg font-bold font-mono text-white/40">--:--</span>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            {getStatusBadge(match.status)}
            {isLive && timer && timer.elapsed > 0 && (
              <span className="text-[10px] text-white/50 font-mono">{formatTime(timer.elapsed)} elapsed</span>
            )}
          </div>
        </div>

        {/* Fighter 2 name */}
        <span className="text-sm font-bold text-white truncate flex-1 text-right">{match.f2_name}</span>
      </div>

      {/* ── Score panels: two colored halves ── */}
      <div className="flex">
        {/* Fighter 1 score */}
        <div
          className={`flex-1 flex items-center justify-center py-8 relative transition-all duration-500 ${
            f1Winning && isLive ? 'animate-pulse-live' : ''
          }`}
          style={{
            backgroundColor: match.f1_color ?? '#1BA34E',
            animationDuration: f1Winning && isLive ? '2.5s' : undefined,
          }}
        >
          {f1Winning && (
            <Trophy
              className="absolute top-2 right-3 h-5 w-5 animate-bounce opacity-80"
              style={{ animationDuration: '2s', color: advColor }}
            />
          )}
          <span
            className="text-7xl sm:text-8xl font-black font-mono leading-none tracking-tighter transition-transform duration-300"
            style={{ color: f1Text }}
          >
            {f1Score}
          </span>
        </div>

        {/* Fighter 2 score */}
        <div
          className={`flex-1 flex items-center justify-center py-8 relative transition-all duration-500 ${
            f2Winning && isLive ? 'animate-pulse-live' : ''
          }`}
          style={{
            backgroundColor: match.f2_color ?? '#FFFFFF',
            animationDuration: f2Winning && isLive ? '2.5s' : undefined,
          }}
        >
          {f2Winning && (
            <Trophy
              className="absolute top-2 left-3 h-5 w-5 animate-bounce opacity-80"
              style={{ animationDuration: '2s', color: advColor }}
            />
          )}
          <span
            className="text-7xl sm:text-8xl font-black font-mono leading-none tracking-tighter transition-transform duration-300"
            style={{ color: f2Text }}
          >
            {f2Score}
          </span>
        </div>
      </div>

      {/* ── Bottom strip: Advantages (gold) + Penalties (red) for each fighter ── */}
      <div className="flex text-center font-bold font-mono text-sm">
        {/* F1 Advantages */}
        <div className="flex-1 py-2" style={{ backgroundColor: advColor, color: '#121A2E' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70 leading-none mb-0.5">Adv</div>
          <div className="text-lg leading-none">{match.f1_adv}</div>
        </div>
        {/* F1 Penalties */}
        <div className="flex-1 py-2" style={{ backgroundColor: penColor, color: '#FFFFFF' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80 leading-none mb-0.5">Pen</div>
          <div className="text-lg leading-none">{match.f1_pen}</div>
        </div>
        {/* F2 Advantages */}
        <div className="flex-1 py-2" style={{ backgroundColor: advColor, color: '#121A2E' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70 leading-none mb-0.5">Adv</div>
          <div className="text-lg leading-none">{match.f2_adv}</div>
        </div>
        {/* F2 Penalties */}
        <div className="flex-1 py-2" style={{ backgroundColor: penColor, color: '#FFFFFF' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80 leading-none mb-0.5">Pen</div>
          <div className="text-lg leading-none">{match.f2_pen}</div>
        </div>
      </div>

      {/* Match ID tag */}
      <div className="bg-[#121A2E] px-4 py-1 flex items-center justify-center">
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Match #{match.id}</span>
      </div>
    </div>
  );
}
