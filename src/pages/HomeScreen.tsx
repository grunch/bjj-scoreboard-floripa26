import { useEffect, useMemo, useRef, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
import { Pencil, Check, Bug, Monitor, LayoutList, Copy, Loader2 } from 'lucide-react';
import { MatchEvent, useMatches } from '@/hooks/useMatches';
import MatchCard, { CardMode } from '@/components/MatchCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DEBUG_MATCHES } from '@/lib/debugMatches';
import { publishDebugMatchesToRelays } from '@/lib/publishDebug';

function truncateNpub(value: string) {
  if (value.length <= 20) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function validatePubkey(value: string): { valid: true; hex: string } | { valid: false; error: string } {
  const v = value.trim();
  if (!v) return { valid: false, error: 'Enter an npub or 64-char hex pubkey' };

  try {
    const decoded = nip19.decode(v);
    if (decoded?.type === 'npub' && typeof decoded.data === 'string' && /^[0-9a-fA-F]{64}$/.test(decoded.data)) {
      return { valid: true, hex: decoded.data };
    }
  } catch {
    // ignore
  }

  if (/^[0-9a-fA-F]{64}$/.test(v)) {
    return { valid: true, hex: v };
  }

  return { valid: false, error: 'Invalid npub or hex pubkey' };
}

type StatusFilter = 'active' | 'waiting' | 'in-progress' | 'finished' | 'canceled';

export default function HomeScreen() {
  const [inputValue, setInputValue] = useState('');
  const [loadedPubkey, setLoadedPubkey] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [touched, setTouched] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('active');
  const [displayMode, setDisplayMode] = useState<CardMode>('compact');
  const navigate = useNavigate();

  const validation = useMemo(() => validatePubkey(inputValue), [inputValue]);

  const { data: liveMatches = [], isLoading } = useMatches(loadedPubkey);

  const allMatches: MatchEvent[] = debugMode ? DEBUG_MATCHES : liveMatches;

  const { nostr } = useNostr();

  // Debug publish state — reusable ephemeral key for session
  const debugKeyRef = useRef<Uint8Array | null>(null);
  const [debugNpub, setDebugNpub] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'published' | 'failed'>('idle');

  // Live subscription is managed by useMatches — no polling needed.

  const handleLoad = () => {
    setTouched(true);
    if (!validation.valid) return;
    setLoadedPubkey(inputValue.trim());
    setIsEditing(false);
    setDebugMode(false);
  };

  const handleEdit = () => {
    setInputValue(loadedPubkey);
    setIsEditing(true);
    setTouched(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLoad();
  };

  const handleDebugToggle = () => {
    const next = !debugMode;
    setDebugMode(next);
    if (next) setFilter('active');
  };

  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === 'compact' ? 'broadcast' : 'compact');
  };

  const handlePublishDebug = async () => {
    try {
      // Reuse key across the session
      if (!debugKeyRef.current) {
        debugKeyRef.current = generateSecretKey();
      }
      const sk = debugKeyRef.current;
      setDebugNpub(nip19.npubEncode(getPublicKey(sk)));
      setPublishing(true);
      setPublishStatus('idle');

      await publishDebugMatchesToRelays({ matches: DEBUG_MATCHES, nostr, secretKey: sk });

      setPublishing(false);
      setPublishStatus('published');
    } catch (err) {
      console.error('Debug publish failed:', err);
      setPublishing(false);
      setPublishStatus('failed');
    }
  };

  const visible = useMemo(() => {
    let list = debugMode
      ? allMatches
      : allMatches.filter(m => (m.created_at ?? 0) >= (Date.now() / 1000 - 24 * 3600));

    if (filter === 'active') list = list.filter(m => m.status === 'waiting' || m.status === 'in-progress');
    else list = list.filter(m => m.status === filter);
    return list;
  }, [allMatches, filter, debugMode]);

  const hasData = debugMode || !!loadedPubkey;
  const bc = displayMode === 'broadcast';

  return (
    <div className={`min-h-screen bg-background ${bc ? 'p-2 sm:p-4' : 'p-6'}`}>
      <div className={bc ? 'w-full' : 'max-w-4xl mx-auto'}>
        {/* Header */}
        <div className={`flex items-center justify-between gap-4 ${bc ? 'mb-3' : 'mb-6'}`}>
          <h1 className={`font-bold text-foreground shrink-0 ${bc ? 'text-xl' : 'text-3xl'}`}>
            BJJ Live Scoreboard
          </h1>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />

            {/* Display mode toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={bc ? 'default' : 'ghost'}
                  size="icon"
                  onClick={toggleDisplayMode}
                  className="h-9 w-9 rounded-full"
                >
                  {bc ? <LayoutList className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                  <span className="sr-only">{bc ? 'Switch to compact' : 'Switch to broadcast'}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{bc ? 'Compact view' : 'Broadcast view'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Debug toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={debugMode ? 'default' : 'ghost'}
                  size="icon"
                  onClick={handleDebugToggle}
                  className="h-9 w-9 rounded-full"
                >
                  <Bug className="h-4 w-4" />
                  <span className="sr-only">Debug mode</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{debugMode ? 'Exit debug mode' : 'Show demo matches'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Pubkey input / label */}
            {!debugMode && (
              <>
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
                      {touched && !validation.valid && (
                        <div className="text-sm text-destructive mt-1">{validation.error}</div>
                      )}
                    </div>
                    <Button onClick={handleLoad} disabled={!validation.valid} title={!validation.valid ? 'Enter a valid npub or hex' : 'Load matches'}>
                      {validation.valid ? <Check className="h-4 w-4" /> : 'Load'}
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
              </>
            )}
          </div>
        </div>

        {/* Debug banner */}
        {debugMode && (
          <div className={`rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 space-y-2 ${bc ? 'mb-2' : 'mb-4'}`}>
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-sm text-amber-600 dark:text-amber-400 flex-1">
                Debug mode — showing 8 hardcoded demo matches.
              </span>

              <Button
                size="sm"
                variant="default"
                onClick={handlePublishDebug}
                disabled={publishing}
              >
                {publishing ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Publishing...</>
                ) : publishStatus === 'published' ? (
                  'Publish again'
                ) : (
                  'Publish to Nostr'
                )}
              </Button>
            </div>

            {/* Published npub display */}
            {debugNpub && (
              <div className="flex items-center gap-2 pl-6">
                {publishStatus === 'published' && (
                  <span className="text-xs text-green-600 dark:text-green-400 shrink-0">Published!</span>
                )}
                {publishStatus === 'failed' && (
                  <span className="text-xs text-destructive shrink-0">Failed — check console</span>
                )}
                <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded truncate max-w-[300px]" title={debugNpub}>
                  {debugNpub}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => navigator.clipboard.writeText(debugNpub)}
                  title="Copy npub"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Status filters */}
        {hasData && (
          <div className={`flex flex-wrap gap-2 ${bc ? 'mb-2' : 'mb-4'}`}>
            {([
              ['active', 'Waiting / In-progress'],
              ['waiting', 'Waiting'],
              ['in-progress', 'In-progress'],
              ['finished', 'Finished'],
              ['canceled', 'Canceled'],
            ] as [StatusFilter, string][]).map(([key, label]) => (
              <Button
                key={key}
                variant={filter === key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        )}

        {!debugMode && isLoading && <div className="text-sm text-muted-foreground mb-2">Connecting…</div>}

        {/* Content */}
        {!hasData ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-5xl mb-4">🥋</div>
            <p className="text-lg">Enter an npub or hex pubkey above to view live matches.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-5xl mb-4">🥋</div>
            <p>No matches found for this filter. Try a different one.</p>
          </div>
        ) : (
          <div className={`flex flex-col ${bc ? 'gap-3' : 'gap-4'}`}>
            {visible.map(m => (
              <MatchCard key={m.id} match={m} onOpen={(id) => navigate(`/match/${id}`)} mode={displayMode} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className={`text-center text-xs text-muted-foreground ${bc ? 'mt-4' : 'mt-12'}`}>
          Vibed with{' '}
          <a href="https://shakespeare.diy" className="underline hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">
            Shakespeare
          </a>
        </div>
      </div>
    </div>
  );
}
