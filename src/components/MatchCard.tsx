import { useEffect, useState } from 'react';
import { MatchEvent } from '@/hooks/useMatches';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock } from 'lucide-react';

export type CardMode = 'compact' | 'broadcast';

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
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#121A2E' : '#FFFFFF';
}

function getStatusBadge(status: string, bc: boolean) {
  const sz = bc ? 'text-xs' : 'text-[10px]';
  const dot = bc ? 'h-2 w-2' : 'h-1.5 w-1.5';
  const ico = bc ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5';

  switch (status) {
    case 'in-progress':
      return (
        <Badge className={`bg-[#1BA34E] text-white gap-1 ${sz}`}>
          <span className={`relative flex ${dot}`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75`} />
            <span className={`relative inline-flex rounded-full ${dot} bg-white`} />
          </span>
          LIVE
        </Badge>
      );
    case 'waiting':
      return <Badge variant="secondary" className={`gap-1 ${sz}`}><Clock className={ico} /> Waiting</Badge>;
    case 'finished':
      return <Badge variant="outline" className={`gap-1 ${sz} border-white/30 text-white/80`}><Trophy className={ico} /> Finished</Badge>;
    case 'canceled':
      return <Badge variant="outline" className={`gap-1 ${sz} border-white/30 text-white/50`}>Canceled</Badge>;
    default:
      return <Badge variant="outline" className={sz}>{status}</Badge>;
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

interface MatchCardProps {
  match: MatchEvent;
  onOpen: (id: string) => void;
  mode?: CardMode;
}

export default function MatchCard({ match, onOpen, mode = 'compact' }: MatchCardProps) {
  const f1Score = match.f1_pt2 * 2 + match.f1_pt3 * 3 + match.f1_pt4 * 4;
  const f2Score = match.f2_pt2 * 2 + match.f2_pt3 * 3 + match.f2_pt4 * 4;

  const isLive = match.status === 'in-progress';
  const f1Winning = f1Score > f2Score;
  const f2Winning = f2Score > f1Score;

  const timer = useElapsed(match);

  const f1Text = contrastText(match.f1_color);
  const f2Text = contrastText(match.f2_color, false);

  const advColor = '#F5B800';
  const penColor = '#C0392B';

  const bc = mode === 'broadcast';

  return (
    <div
      className={`
        group relative cursor-pointer overflow-hidden
        transition-all duration-300 shadow-md
        hover:shadow-xl
        ${bc ? 'rounded-2xl' : 'rounded-xl hover:-translate-y-0.5'}
        ${isLive ? 'animate-glow-green ring-1 ring-[#1BA34E]/30' : 'ring-1 ring-border hover:ring-[#1BA34E]/20'}
      `}
      onClick={() => onOpen(match.id)}
    >
      {/* ── Top bar ── */}
      <div className={`bg-[#121A2E] flex items-center justify-between gap-2 ${bc ? 'px-8 py-5' : 'px-4 py-3'}`}>
        {/* Fighter 1 name */}
        <span className={`font-bold text-white truncate flex-1 ${bc ? 'text-2xl' : 'text-sm'}`}>
          {match.f1_name}
        </span>

        {/* Center: timer + status */}
        <div className={`flex flex-col items-center shrink-0 ${bc ? 'px-8' : 'px-4'}`}>
          {isLive && timer ? (
            <span className={`font-bold font-mono tracking-wider ${
              bc ? 'text-5xl' : 'text-2xl'
            } ${
              timer.remaining <= 30 ? 'text-[#F5B800] animate-pulse-live' : 'text-white'
            }`}>
              {formatTime(Math.max(0, timer.remaining))}
            </span>
          ) : match.status === 'waiting' ? (
            <span className={`font-bold font-mono tracking-wider text-white/60 ${bc ? 'text-5xl' : 'text-2xl'}`}>
              {formatTime(match.duration)}
            </span>
          ) : (
            <span className={`font-bold font-mono text-white/40 ${bc ? 'text-4xl' : 'text-lg'}`}>--:--</span>
          )}
          <div className={`flex items-center gap-2 ${bc ? 'mt-2' : 'mt-0.5'}`}>
            {getStatusBadge(match.status, bc)}
            {isLive && timer && timer.elapsed > 0 && (
              <span className={`text-white/50 font-mono ${bc ? 'text-sm' : 'text-[10px]'}`}>
                {formatTime(timer.elapsed)} elapsed
              </span>
            )}
          </div>
        </div>

        {/* Fighter 2 name */}
        <span className={`font-bold text-white truncate flex-1 text-right ${bc ? 'text-2xl' : 'text-sm'}`}>
          {match.f2_name}
        </span>
      </div>

      {/* ── Score panels ── */}
      <div className="flex">
        {/* Fighter 1 score */}
        <div
          className={`flex-1 flex items-center justify-center relative transition-all duration-500 ${
            bc ? 'py-16 sm:py-24' : 'py-8'
          } ${f1Winning && isLive ? 'animate-pulse-live' : ''}`}
          style={{
            backgroundColor: match.f1_color ?? '#1BA34E',
            animationDuration: f1Winning && isLive ? '2.5s' : undefined,
          }}
        >
          {f1Winning && (
            <Trophy
              className={`absolute animate-bounce opacity-80 ${bc ? 'top-4 right-5 h-8 w-8' : 'top-2 right-3 h-5 w-5'}`}
              style={{ animationDuration: '2s', color: advColor }}
            />
          )}
          <span
            className={`font-black font-mono leading-none tracking-tighter transition-transform duration-300 ${
              bc ? 'text-[10rem] sm:text-[14rem]' : 'text-7xl sm:text-8xl'
            }`}
            style={{ color: f1Text }}
          >
            {f1Score}
          </span>
        </div>

        {/* Fighter 2 score */}
        <div
          className={`flex-1 flex items-center justify-center relative transition-all duration-500 ${
            bc ? 'py-16 sm:py-24' : 'py-8'
          } ${f2Winning && isLive ? 'animate-pulse-live' : ''}`}
          style={{
            backgroundColor: match.f2_color ?? '#FFFFFF',
            animationDuration: f2Winning && isLive ? '2.5s' : undefined,
          }}
        >
          {f2Winning && (
            <Trophy
              className={`absolute animate-bounce opacity-80 ${bc ? 'top-4 left-5 h-8 w-8' : 'top-2 left-3 h-5 w-5'}`}
              style={{ animationDuration: '2s', color: advColor }}
            />
          )}
          <span
            className={`font-black font-mono leading-none tracking-tighter transition-transform duration-300 ${
              bc ? 'text-[10rem] sm:text-[14rem]' : 'text-7xl sm:text-8xl'
            }`}
            style={{ color: f2Text }}
          >
            {f2Score}
          </span>
        </div>
      </div>

      {/* ── Bottom strip: Adv + Pen ── */}
      <div className={`flex text-center font-bold font-mono ${bc ? 'text-base' : 'text-sm'}`}>
        {/* F1 Advantages */}
        <div className={`flex-1 ${bc ? 'py-4' : 'py-2'}`} style={{ backgroundColor: advColor, color: '#121A2E' }}>
          <div className={`font-semibold uppercase tracking-wider opacity-70 leading-none mb-0.5 ${bc ? 'text-xs' : 'text-[10px]'}`}>Adv</div>
          <div className={`leading-none ${bc ? 'text-3xl' : 'text-lg'}`}>{match.f1_adv}</div>
        </div>
        {/* F1 Penalties */}
        <div className={`flex-1 ${bc ? 'py-4' : 'py-2'}`} style={{ backgroundColor: penColor, color: '#FFFFFF' }}>
          <div className={`font-semibold uppercase tracking-wider opacity-80 leading-none mb-0.5 ${bc ? 'text-xs' : 'text-[10px]'}`}>Pen</div>
          <div className={`leading-none ${bc ? 'text-3xl' : 'text-lg'}`}>{match.f1_pen}</div>
        </div>
        {/* F2 Advantages */}
        <div className={`flex-1 ${bc ? 'py-4' : 'py-2'}`} style={{ backgroundColor: advColor, color: '#121A2E' }}>
          <div className={`font-semibold uppercase tracking-wider opacity-70 leading-none mb-0.5 ${bc ? 'text-xs' : 'text-[10px]'}`}>Adv</div>
          <div className={`leading-none ${bc ? 'text-3xl' : 'text-lg'}`}>{match.f2_adv}</div>
        </div>
        {/* F2 Penalties */}
        <div className={`flex-1 ${bc ? 'py-4' : 'py-2'}`} style={{ backgroundColor: penColor, color: '#FFFFFF' }}>
          <div className={`font-semibold uppercase tracking-wider opacity-80 leading-none mb-0.5 ${bc ? 'text-xs' : 'text-[10px]'}`}>Pen</div>
          <div className={`leading-none ${bc ? 'text-3xl' : 'text-lg'}`}>{match.f2_pen}</div>
        </div>
      </div>

      {/* Match ID tag */}
      <div className={`bg-[#121A2E] flex items-center justify-center ${bc ? 'px-8 py-2' : 'px-4 py-1'}`}>
        <span className={`font-mono text-white/30 uppercase tracking-widest ${bc ? 'text-xs' : 'text-[10px]'}`}>
          Match #{match.id}
        </span>
      </div>
    </div>
  );
}
