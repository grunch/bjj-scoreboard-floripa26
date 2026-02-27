import { MatchEvent } from '@/hooks/useMatches';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Swords } from 'lucide-react';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'in-progress':
      return (
        <Badge className="bg-primary text-primary-foreground gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground" />
          </span>
          LIVE
        </Badge>
      );
    case 'waiting':
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Waiting</Badge>;
    case 'finished':
      return <Badge variant="outline" className="gap-1"><Trophy className="h-3 w-3" /> Finished</Badge>;
    case 'canceled':
      return <Badge variant="outline" className="gap-1 border-muted-foreground/40 text-muted-foreground">Canceled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function MatchCard({ match, onOpen }: { match: MatchEvent; onOpen: (id: string) => void }) {
  const f1Score = match.f1_pt2 * 2 + match.f1_pt3 * 3 + match.f1_pt4 * 4;
  const f2Score = match.f2_pt2 * 2 + match.f2_pt3 * 3 + match.f2_pt4 * 4;

  const isLive = match.status === 'in-progress';
  const isTied = f1Score === f2Score;
  const f1Winning = f1Score > f2Score;
  const f2Winning = f2Score > f1Score;

  return (
    <div
      className={`
        group relative cursor-pointer rounded-xl border bg-card text-card-foreground
        overflow-hidden transition-all duration-300
        hover:shadow-lg hover:-translate-y-0.5
        ${isLive ? 'animate-glow-green border-primary/30' : 'hover:border-primary/20'}
      `}
      onClick={() => onOpen(match.id)}
    >
      {/* Gradient winner indicator bar */}
      {!isTied && (
        <div
          className={`absolute top-0 h-1 transition-all duration-700 ease-out ${
            f1Winning ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l'
          }`}
          style={{
            width: `${Math.min(90, 50 + Math.abs(f1Score - f2Score) * 5)}%`,
            backgroundImage: f1Winning
              ? `linear-gradient(to right, ${match.f1_color ?? 'hsl(145, 72%, 35%)'}, transparent)`
              : `linear-gradient(to left, ${match.f2_color ?? 'hsl(145, 72%, 35%)'}, transparent)`,
          }}
        />
      )}

      <div className="p-5">
        {/* Top row: match ID + status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">#{match.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatDuration(match.duration)}</span>
            {getStatusBadge(match.status)}
          </div>
        </div>

        {/* Scoreboard */}
        <div className="flex items-stretch gap-3">
          {/* Fighter 1 */}
          <div
            className={`flex-1 rounded-lg p-4 transition-all duration-500 relative overflow-hidden ${
              f1Winning ? 'ring-2 ring-primary/50 scale-[1.02]' : isTied ? '' : 'opacity-75 scale-[0.98]'
            }`}
            style={{
              backgroundColor: match.f1_color ? `${match.f1_color}18` : 'hsl(220, 45%, 12%, 0.06)',
              borderLeft: `3px solid ${match.f1_color ?? '#121A2E'}`,
            }}
          >
            {f1Winning && isLive && (
              <div className="absolute inset-0 animate-pulse-live opacity-10 rounded-lg" style={{ backgroundColor: match.f1_color ?? '#1BA34E' }} />
            )}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full shrink-0 ring-1 ring-border" style={{ backgroundColor: match.f1_color ?? '#121A2E' }} />
                <span className="text-sm font-semibold text-foreground truncate">{match.f1_name}</span>
                {f1Winning && <Trophy className="h-3.5 w-3.5 shrink-0 animate-bounce" style={{ animationDuration: '2s', color: 'hsl(var(--bjj-gold))' }} />}
              </div>
              <div className={`text-3xl font-bold font-mono tracking-tight transition-colors duration-300 ${
                f1Winning ? 'text-primary' : 'text-foreground'
              }`}>
                {f1Score}
              </div>
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                <span>Adv {match.f1_adv}</span>
                <span>Pen {match.f1_pen}</span>
              </div>
            </div>
          </div>

          {/* VS divider */}
          <div className="flex flex-col items-center justify-center px-1">
            <span className="text-xs font-bold text-muted-foreground tracking-widest">VS</span>
          </div>

          {/* Fighter 2 */}
          <div
            className={`flex-1 rounded-lg p-4 transition-all duration-500 relative overflow-hidden ${
              f2Winning ? 'ring-2 ring-primary/50 scale-[1.02]' : isTied ? '' : 'opacity-75 scale-[0.98]'
            }`}
            style={{
              backgroundColor: match.f2_color ? `${match.f2_color}18` : 'hsl(0, 0%, 100%, 0.06)',
              borderRight: `3px solid ${match.f2_color ?? '#FFFFFF'}`,
            }}
          >
            {f2Winning && isLive && (
              <div className="absolute inset-0 animate-pulse-live opacity-10 rounded-lg" style={{ backgroundColor: match.f2_color ?? '#1BA34E' }} />
            )}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full shrink-0 ring-1 ring-border" style={{ backgroundColor: match.f2_color ?? '#FFFFFF' }} />
                <span className="text-sm font-semibold text-foreground truncate">{match.f2_name}</span>
                {f2Winning && <Trophy className="h-3.5 w-3.5 shrink-0 animate-bounce" style={{ animationDuration: '2s', color: 'hsl(var(--bjj-gold))' }} />}
              </div>
              <div className={`text-3xl font-bold font-mono tracking-tight transition-colors duration-300 ${
                f2Winning ? 'text-primary' : 'text-foreground'
              }`}>
                {f2Score}
              </div>
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                <span>Adv {match.f2_adv}</span>
                <span>Pen {match.f2_pen}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
