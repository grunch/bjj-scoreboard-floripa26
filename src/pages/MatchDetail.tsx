import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMatches, MatchEvent } from '@/hooks/useMatches';

function formatTimeLeft(match: MatchEvent) {
  if (match.status !== 'in-progress' || !match.start_at) return null;
  const end = match.start_at + match.duration;
  const left = end - Math.floor(Date.now() / 1000);
  return left > 0 ? left : 0;
}

export default function MatchDetail() {
  const { id } = useParams();
  const { data: matches = [], refetch } = useMatches();
  const [match, setMatch] = useState<MatchEvent | undefined>(undefined);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    setMatch(matches.find(m => m.id === id));
  }, [matches, id]);

  useEffect(() => {
    const t = setInterval(() => {
      if (!match) return;
      setTimeLeft(formatTimeLeft(match));
    }, 500);
    return () => clearInterval(t);
  }, [match]);

  if (!match) return <div className="min-h-screen p-6">Match not found</div>;

  const f1Score = match.f1_pt2 * 2 + match.f1_pt3 * 3 + match.f1_pt4 * 4;
  const f2Score = match.f2_pt2 * 2 + match.f2_pt3 * 3 + match.f2_pt4 * 4;

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white">{match.f1_name} vs {match.f2_name}</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg p-6" style={{background: match.f1_color ?? '#121A2E'}}>
            <div className="text-sm text-muted-foreground">{match.f1_name}</div>
            <div className="text-4xl font-bold">{f1Score}</div>
            <div className="text-sm">Adv: {match.f1_adv} • Pen: {match.f1_pen}</div>
          </div>

          <div className="rounded-lg p-6" style={{background: match.f2_color ?? '#FFFFFF'}}>
            <div className="text-sm text-muted-foreground">{match.f2_name}</div>
            <div className="text-4xl font-bold">{f2Score}</div>
            <div className="text-sm">Adv: {match.f2_adv} • Pen: {match.f2_pen}</div>
          </div>
        </div>

        <div className="mt-6">
          <div>Status: {match.status}</div>
          <div>Duration: {match.duration}s</div>
          <div>Time Left: {timeLeft ?? '--'}</div>
        </div>
      </div>
    </div>
  );
}
