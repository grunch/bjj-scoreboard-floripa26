import { useQuery } from "@tanstack/react-query";
import { useNostr } from "@nostrify/react";
import { nip19 } from "nostr-tools";

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
  raw?: any;
};

const KIND = 31415;

function parsePubkey(value?: string) {
  if (!value) return undefined;
  try {
    const decoded = nip19.decode(value);
    if (decoded.type === 'npub' && typeof decoded.data === 'string') return decoded.data;
  } catch {}
  // assume raw hex
  return value.length === 64 ? value : undefined;
}

export function useMatches(pubkey?: string) {
  const { nostr } = useNostr();
  const hex = parsePubkey(pubkey);

  return useQuery<MatchEvent[]>({
    queryKey: ["nostr", "matches", hex ?? ""],
    queryFn: async () => {
      if (!hex) return [];
      const since = Math.floor(Date.now() / 1000) - 24 * 3600;
      const events = await nostr.query([
        { kinds: [KIND], authors: [hex], since, limit: 1000 },
      ], { signal: AbortSignal.timeout(5000) });

      const parsed: MatchEvent[] = [];

      for (const ev of events) {
        try {
          const content = typeof ev.content === 'string' && ev.content ? JSON.parse(ev.content) : {};
          // find d tag
          const d = (ev.tags || []).find((t: any) => t[0] === 'd')?.[1] ?? content.id;
          if (!d) continue;

          const m: MatchEvent = {
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
            raw: ev,
          };

          parsed.push(m);
        } catch (err) {
          // ignore parse errors
          console.warn('Failed to parse match event', err);
        }
      }

      // Deduplicate by id (d) keeping newest created_at
      const grouped = new Map<string, MatchEvent>();
      for (const p of parsed) {
        const prev = grouped.get(p.id);
        if (!prev || (p.created_at ?? 0) > (prev.created_at ?? 0)) {
          grouped.set(p.id, p);
        }
      }

      const results = Array.from(grouped.values()).sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));

      return results;
    },
    // refresh more often when matches are in-progress is handled by components via refetchInterval
    staleTime: 5000,
  });
}
