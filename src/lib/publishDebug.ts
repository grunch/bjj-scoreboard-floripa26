import { getPublicKey, finalizeEvent, nip19 } from 'nostr-tools';
import { MatchEvent } from '@/hooks/useMatches';

const PUBLISH_RELAYS = ['wss://nos.lol', 'wss://relay.damus.io'];

export async function publishDebugMatchesToRelays(
  { matches, nostr, secretKey }: { matches: MatchEvent[]; nostr: any; secretKey: Uint8Array }
): Promise<string> {
  const pubkey = getPublicKey(secretKey);
  const npub = nip19.npubEncode(pubkey);
  const now = Math.floor(Date.now() / 1000);

  for (const m of matches) {
    const content = JSON.stringify({
      id: m.id,
      status: m.status,
      start_at: m.start_at,
      duration: m.duration,
      f1_name: m.f1_name,
      f2_name: m.f2_name,
      f1_color: m.f1_color,
      f2_color: m.f2_color,
      f1_pt2: m.f1_pt2, f2_pt2: m.f2_pt2,
      f1_pt3: m.f1_pt3, f2_pt3: m.f2_pt3,
      f1_pt4: m.f1_pt4, f2_pt4: m.f2_pt4,
      f1_adv: m.f1_adv, f2_adv: m.f2_adv,
      f1_pen: m.f1_pen, f2_pen: m.f2_pen,
    });

    const tags = [
      ['d', m.id],
      ['expiration', String(now + 7 * 24 * 3600)],
    ];

    // finalizeEvent computes id, pubkey, and sig
    const signed = finalizeEvent({
      kind: 31415,
      content,
      tags,
      created_at: now,
    }, secretKey);

    // Publish to each relay directly
    for (const url of PUBLISH_RELAYS) {
      try {
        const relay = nostr.relay(url);
        await relay.event(signed, { signal: AbortSignal.timeout(5000) });
      } catch (e) {
        console.warn(`Relay publish failed for ${url}:`, e);
      }
    }
  }

  return npub;
}
