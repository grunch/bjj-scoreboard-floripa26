import { useEffect, useMemo, useState } from 'react';
import { Pencil, Check } from 'lucide-react';
import { useMatches } from '@/hooks/useMatches';
import MatchCard from '@/components/MatchCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { nip19 } from 'nostr-tools';

function truncateNpub(value: string) {
  if (value.length <= 20) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function validatePubkey(value: string) {
  const v = value.trim();
  if (!v) return { valid: false, error: 'Enter an npub or 64-char hex pubkey' };

  // try nip19 decode
  try {
    const decoded = nip19.decode(v);
    if (decoded?.type === 'npub' && typeof decoded.data === 'string' && /^[0-9a-fA-F]{64}$/.test(decoded.data)) {
      return { valid: true, type: 'npub', hex: decoded.data };
    }
  } catch (e) {
    // ignore
  }

  // check hex
  if (/^[0-9a-fA-F]{64}$/.test(v)) {
    return { valid: true, type: 'hex', hex: v };
  }

  return { valid: false, error: 'Invalid npub or hex pubkey' };
}

export default function HomeScreen() {
  const [inputValue, setInputValue] = useState('');
  const [loadedPubkey, setLoadedPubkey] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();

  const validation = useMemo(() => validatePubkey(inputValue), [inputValue]);
  const isValid = !!(validation && (validation as any).valid);

  const { data: matches = [], refetch, isFetching } = useMatches(loadedPubkey);
  const [filter, setFilter] = useState<'waiting' | 'in-progress' | 'finished' | 'canceled' | 'active'>('active');

  useEffect(() => {
    if (!loadedPubkey) return;
    const id = setInterval(() => refetch(), 3000);
    return () => clearInterval(id);
  }, [refetch, loadedPubkey]);

  const handleLoad = () => {
    setTouched(true);
    if (!isValid) return;
    // normalize to hex for storage if needed; use original input for display
    const hex = (validation as any).hex ?? inputValue.trim();
    // keep display as provided (npub or hex)
    setLoadedPubkey(inputValue.trim());
    setIsEditing(false);
  };

  const handleEdit = () => {
    setInputValue(loadedPubkey);
    setIsEditing(true);
    setTouched(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLoad();
  };

  const visible = useMemo(() => {
    const now = Date.now() / 1000;
    let list = matches.filter(m => (m.created_at ?? 0) >= (now - 24 * 3600));
    if (filter === 'active') list = list.filter(m => m.status === 'waiting' || m.status === 'in-progress');
    else list = list.filter(m => m.status === filter);
    return list;
  }, [matches, filter]);

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">BJJ Live Scoreboard</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {isEditing ? (
              <div className="flex items-start gap-2">
                <div>
                  <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter npub or hex pubkey"
                    className="w-64"
                    onBlur={() => setTouched(true)}
                  />
                  {touched && !isValid && (
                    <div className="text-sm text-destructive mt-1">{(validation as any).error}</div>
                  )}
                </div>

                <Button onClick={handleLoad} disabled={!isValid} title={!isValid ? 'Enter a valid npub or hex' : 'Load matches'}>
                  {isValid ? <Check className="h-4 w-4" /> : 'Load'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground truncate max-w-[200px]" title={loadedPubkey}>
                  {truncateNpub(loadedPubkey)}
                </span>
                <Button variant="ghost" size="icon" onClick={handleEdit} className="h-8 w-8">
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Change pubkey</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Status filters — only show when a pubkey is loaded */}
        {loadedPubkey && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant={filter === 'active' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('active')}>Waiting / In-progress</Button>
            <Button variant={filter === 'waiting' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('waiting')}>Waiting</Button>
            <Button variant={filter === 'in-progress' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('in-progress')}>In-progress</Button>
            <Button variant={filter === 'finished' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('finished')}>Finished</Button>
            <Button variant={filter === 'canceled' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('canceled')}>Canceled</Button>
          </div>
        )}

        {isFetching && <div className="text-sm text-muted-foreground mb-2">Refreshing...</div>}

        {/* Content */}
        {!loadedPubkey ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-5xl mb-4">🥋</div>
            <p className="text-lg">Enter an npub or hex pubkey above to view live matches.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-5xl mb-4">🥋</div>
            <p>No matches found. Check back soon or try a different filter.</p>
          </div>
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
