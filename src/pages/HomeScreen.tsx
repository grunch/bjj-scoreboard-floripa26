import React, { useEffect, useMemo, useState } from 'react';
import { useMatches } from '@/hooks/useMatches';
import MatchCard from '@/components/MatchCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function HomeScreen() {
  const [pubkey, setPubkey] = useState('');
  const { data: matches = [], refetch, isFetching } = useMatches(pubkey);
  const [filter, setFilter] = useState<'waiting'|'in-progress'|'finished'|'canceled'|'active'>('active');
  const navigate = useNavigate();

  useEffect(() => {
    const id = setInterval(() => refetch(), 3000);
    return () => clearInterval(id);
  }, [refetch]);

  const visible = useMemo(() => {
    const now = Date.now() / 1000;
    let list = matches.filter(m => (m.created_at ?? 0) >= (now - 24*3600));
    if (filter === 'active') list = list.filter(m => m.status === 'waiting' || m.status === 'in-progress');
    else list = list.filter(m => m.status === filter);
    return list;
  }, [matches, filter]);

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">BJJ Match Live Dashboard</h1>
          <div className="flex items-center gap-2">
            <Input value={pubkey} onChange={e => setPubkey(e.target.value)} placeholder="Enter npub or hex pubkey" />
            <Button onClick={() => refetch()}>Load</Button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button variant={filter==='active' ? 'default' : 'ghost'} onClick={() => setFilter('active')}>Waiting / In-progress</Button>
          <Button variant={filter==='waiting' ? 'default' : 'ghost'} onClick={() => setFilter('waiting')}>Waiting</Button>
          <Button variant={filter==='in-progress' ? 'default' : 'ghost'} onClick={() => setFilter('in-progress')}>In-progress</Button>
          <Button variant={filter==='finished' ? 'default' : 'ghost'} onClick={() => setFilter('finished')}>Finished</Button>
          <Button variant={filter==='canceled' ? 'default' : 'ghost'} onClick={() => setFilter('canceled')}>Canceled</Button>
        </div>

        {isFetching && <div className="text-sm text-muted-foreground">Refreshing...</div>}

        {visible.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">🥋 No matches yet, create a new one!</div>
        ) : (
          <div className="grid gap-4">
            {visible.map(m => (
              <MatchCard key={m.id} match={m} onOpen={(id) => navigate(`/match/${id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
