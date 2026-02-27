import React from 'react';
import { MatchEvent } from '@/hooks/useMatches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MatchCard({ match, onOpen }: { match: MatchEvent; onOpen: (id: string) => void }) {
  const f1Score = match.f1_pt2 * 2 + match.f1_pt3 * 3 + match.f1_pt4 * 4;
  const f2Score = match.f2_pt2 * 2 + match.f2_pt3 * 3 + match.f2_pt4 * 4;

  return (
    <Card className="p-4 cursor-pointer" onClick={() => onOpen(match.id)}>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-sm text-muted-foreground">ID: {match.id}</div>
            <CardTitle className="text-lg">{match.f1_name} <span className="font-mono">{f1Score}</span> vs <span className="font-mono">{f2Score}</span> {match.f2_name}</CardTitle>
          </div>
          <div className="flex flex-col items-end">
            <div className="h-8 w-8 rounded-full border" style={{background: match.f1_color ?? '#121A2E'}} />
            <div className="h-8 w-8 rounded-full border mt-2" style={{background: match.f2_color ?? '#FFFFFF'}} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 text-sm text-muted-foreground">
          <div>Status: {match.status}</div>
          <div>Duration: {match.duration}s</div>
        </div>
      </CardContent>
    </Card>
  );
}
