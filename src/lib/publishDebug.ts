import { nip19, getPublicKey, signEvent } from 'nostr-tools';

export async function publishDebugMatchesToRelays({matches, nostr, privateKey, relays}: {matches:any[], nostr:any, privateKey:string, relays:string[]}) {
  const npub = nip19.npubEncode(getPublicKey(privateKey));

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

    const tags = [['d', m.id], ['expiration', String(Math.floor(Date.now()/1000) + 7*24*3600)]];

    const event: any = {
      kind: 31925,
      content,
      tags,
      created_at: Math.floor(Date.now() / 1000),
      pubkey: getPublicKey(privateKey),
    };

    const sig = await signEvent(event, privateKey);
    const signed = { ...event, sig };

    for (const url of relays) {
      try {
        const relay = nostr.relay(url);
        await relay.event(signed);
      } catch (e) {
        console.warn('Relay publish failed', url, e);
      }
    }
  }

  return npub;
}
