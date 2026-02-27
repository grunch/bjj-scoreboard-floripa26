import { useEffect, useRef, useState, useCallback } from 'react';
import { useNostr } from '@nostrify/react';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';

export type MatchEvent = {
  id: string;
  status: string;
  start_at?: number;
  duration: number;
  f1_name: string;
  f2_name: string;
  f1_color?: string;
  f2_color?: string;
  f1_pt2: number;
  f2_pt2: number;
  f1_pt3: number;
  f2_pt3: number;
  f1_pt4: number;
  f2_pt4: number;
  f1_adv: number;
  f2_adv: number;
  f1_pen: number;
  f2_pen: number;
  created_at?: number;
  pubkey?: string;
};

const KIND = 31415;

function parsePubkey(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const decoded = nip19.decode(value);
    if (decoded.type === 'npub' && typeof decoded.data === 'string') return decoded.data;
  } catch { /* ignore */ }
  return /^[0-9a-fA-F]{64}$/.test(value) ? value : undefined;
}

function parseEvent(ev: NostrEvent): MatchEvent | null {
  try {
    const content = typeof ev.content === 'string' && ev.content ? JSON.parse(ev.content) : {};
    const d = ev.tags.find(t => t[0] === 'd')?.[1] ?? content.id;
    if (!d) return null;

    return {
      id: content.id ?? d,
      status: content.status ?? 'waiting',
      start_at: content.start_at,
      duration: content.duration ?? 300,
      f1_name: content.f1_name ?? 'Fighter 1',
      f2_name: content.f2_name ?? 'Fighter 2',
      f1_color: content.f1_color,
      f2_color: content.f2_color,
      f1_pt2: content.f1_pt2 ?? 0,
      f2_pt2: content.f2_pt2 ?? 0,
      f1_pt3: content.f1_pt3 ?? 0,
      f2_pt3: content.f2_pt3 ?? 0,
      f1_pt4: content.f1_pt4 ?? 0,
      f2_pt4: content.f2_pt4 ?? 0,
      f1_adv: content.f1_adv ?? 0,
      f2_adv: content.f2_adv ?? 0,
      f1_pen: content.f1_pen ?? 0,
      f2_pen: content.f2_pen ?? 0,
      created_at: ev.created_at,
      pubkey: ev.pubkey,
    };
  } catch {
    return null;
  }
}

/** Dedup by match id (d tag), keep newest created_at, sort newest first. */
function dedup(matches: MatchEvent[]): MatchEvent[] {
  const grouped = new Map<string, MatchEvent>();
  for (const m of matches) {
    const prev = grouped.get(m.id);
    if (!prev || (m.created_at ?? 0) > (prev.created_at ?? 0)) {
      grouped.set(m.id, m);
    }
  }
  return Array.from(grouped.values()).sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
}

/**
 * Live WebSocket subscription for kind 31415 match events.
 * Opens a persistent subscription via nostr.req() and updates state
 * as new events arrive in real time.
 */
export function useMatches(pubkey?: string) {
  const { nostr } = useNostr();
  const hex = parsePubkey(pubkey);
  const [matches, setMatches] = useState<MatchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const subscribe = useCallback(async (authorHex: string) => {
    // Cancel any previous subscription
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setMatches([]);

    const since = Math.floor(Date.now() / 1000) - 24 * 3600;
    const collected: MatchEvent[] = [];

    try {
      for await (const msg of nostr.req(
        [{ kinds: [KIND], authors: [authorHex], since, limit: 1000 }],
        { signal: controller.signal },
      )) {
        if (msg[0] === 'EVENT') {
          const parsed = parseEvent(msg[2] as NostrEvent);
          if (parsed) {
            collected.push(parsed);
            // Update state with deduped list on each new event
            setMatches(dedup([...collected]));
          }
        } else if (msg[0] === 'EOSE') {
          // Initial load complete
          setIsLoading(false);
        }
        // 'CLOSED' will break the loop via the signal
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.warn('Subscription error:', e);
      }
    } finally {
      setIsLoading(false);
    }
  }, [nostr]);

  useEffect(() => {
    if (!hex) {
      setMatches([]);
      return;
    }

    subscribe(hex);

    return () => {
      abortRef.current?.abort();
    };
  }, [hex, subscribe]);

  return { data: matches, isLoading };
}
