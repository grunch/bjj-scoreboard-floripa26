# API & Relay Communication

## Relay Configuration

### Default Relays

Defined in `src/App.tsx`:

```typescript
const defaultConfig: AppConfig = {
  theme: 'dark',
  relayMetadata: {
    relays: [
      { url: 'wss://relay.mostro.network', read: true, write: true },
      { url: 'wss://nos.lol', read: true, write: true },
      { url: 'wss://relay.damus.io', read: true, write: true },
    ],
    updatedAt: 0,
  },
};
```

### Debug Publish Relays

Used only by `publishDebugMatchesToRelays()`:

```typescript
const PUBLISH_RELAYS = ['wss://nos.lol', 'wss://relay.damus.io'];
```

### Relay Metadata Sync (NIP-65)

On login, `NostrSync` fetches the user's relay list:

```typescript
const events = await nostr.query(
  [{ kinds: [10002], authors: [user.pubkey], limit: 1 }],
  { signal: AbortSignal.timeout(5000) }
);
```

Relay entries are parsed from `r` tags:
- `["r", "wss://relay.example.com"]` → both read and write
- `["r", "wss://relay.example.com", "read"]` → read only
- `["r", "wss://relay.example.com", "write"]` → write only

## NPool Configuration

**File:** `src/components/NostrProvider.tsx`

The `NPool` from `@nostrify/nostrify` manages connections to multiple relays:

```typescript
const pool = new NPool({
  // Create a new WebSocket relay connection
  open(url: string) {
    return new NRelay1(url);
  },
  
  // Route subscription requests to read relays
  reqRouter(filters: NostrFilter[]) {
    const readRelays = relayMetadata.relays.filter(r => r.read);
    const routes = new Map();
    for (const url of readRelays.map(r => r.url)) {
      routes.set(url, filters);
    }
    return routes;
  },
  
  // Route published events to write relays
  eventRouter(_event: NostrEvent) {
    return relayMetadata.relays.filter(r => r.write).map(r => r.url);
  },
  
  // Wait 200ms for EOSE before considering subscription loaded
  eoseTimeout: 200,
});
```

## Subscription Management

### Match Subscription (`useMatches`)

**File:** `src/hooks/useMatches.ts`

The core subscription that powers the scoreboard:

```typescript
// Filter
const filter = {
  kinds: [31415],
  authors: [authorHex],
  since: Math.floor(Date.now() / 1000) - 24 * 3600,  // Last 24 hours
  limit: 1000,
};

// Subscribe
for await (const msg of nostr.req([filter], { signal })) {
  if (msg[0] === 'EVENT') {
    // Parse and add to state
  } else if (msg[0] === 'EOSE') {
    // Initial load complete
    setIsLoading(false);
  }
}
```

**Lifecycle:**
1. Component mounts → creates `AbortController`
2. Opens persistent subscription via `nostr.req()` (async iterator)
3. Receives stored events, then EOSE
4. Stays open for real-time events until abort
5. Component unmounts → `controller.abort()` cancels subscription

**Pubkey Resolution:**
- Accepts both `npub1...` (bech32) and 64-char hex pubkeys
- Decodes npub to hex via `nip19.decode()`

### Author Metadata Query

**File:** `src/hooks/useAuthor.ts`

```typescript
const [event] = await nostr.query(
  [{ kinds: [0], authors: [pubkey], limit: 1 }],
  { signal: AbortSignal.timeout(1500) }
);
```

- Uses React Query with 5-minute stale time
- 3 retries on failure

### Zap Receipt Query

**File:** `src/hooks/useZaps.ts`

```typescript
// For addressable events (kind 30000-39999)
const events = await nostr.query([{
  kinds: [9735],
  '#a': [`${target.kind}:${target.pubkey}:${identifier}`],
}], { signal });

// For regular events
const events = await nostr.query([{
  kinds: [9735],
  '#e': [target.id],
}], { signal });
```

- Stale time: 30 seconds
- Refetch interval: 60 seconds (only when observed)

### Comment Query (NIP-22)

**File:** `src/hooks/useComments.ts`

```typescript
const filter: NostrFilter = { kinds: [1111] };

// For addressable events:
filter['#A'] = [`${root.kind}:${root.pubkey}:${d}`];

// For regular events:
filter['#E'] = [root.id];
```

## Event Publishing

### General Publishing

**File:** `src/hooks/useNostrPublish.ts`

```typescript
const event = await user.signer.signEvent({
  kind: t.kind,
  content: t.content ?? "",
  tags: [...t.tags, ["client", location.hostname]],
  created_at: t.created_at ?? Math.floor(Date.now() / 1000),
});

await nostr.event(event, { signal: AbortSignal.timeout(5000) });
```

- Adds `client` tag with hostname (only on HTTPS)
- 5-second timeout for publishing
- Uses React Query `useMutation` for state management

### Debug Match Publishing

**File:** `src/lib/publishDebug.ts`

```typescript
const signed = finalizeEvent({
  kind: 31415,
  content: JSON.stringify(matchContent),
  tags: [
    ['d', match.id],
    ['expiration', String(now + 7 * 24 * 3600)],  // Expires in 7 days
  ],
  created_at: now,
}, secretKey);
```

- Publishes directly to specific relay URLs (not through NPool)
- Adds NIP-40 expiration tag (7 days)
- Uses `nostr-tools/finalizeEvent` for signing

## Error Handling

### Subscription Errors

```typescript
try {
  for await (const msg of nostr.req([filter], { signal })) { ... }
} catch (e) {
  if ((e as Error).name !== 'AbortError') {
    console.warn('Subscription error:', e);
  }
}
```

AbortError is expected on cleanup and is silently ignored.

### Relay Connection Failures

Individual relay failures don't crash the app — `NPool` handles this internally. If one relay is down, events from other relays still arrive.

### Timeout Strategy

| Operation | Timeout |
|-----------|---------|
| Author metadata query | 1,500ms |
| NIP-65 relay sync | 5,000ms |
| Event publishing | 5,000ms |
| Zap receipt query | 5,000ms |
| NWC payment | 15,000ms |
| NWC connection test | 10,000ms |

## External APIs

### Shakespeare AI

**Endpoint:** `https://ai.shakespeare.diy/v1`
**Auth:** NIP-98 (kind 27235 event, base64-encoded)
**Features:** Chat completions, streaming, model listing

### Blossom File Upload

**Server:** `https://blossom.primal.net/`
**Auth:** Nostr signer (part of `@nostrify/nostrify/uploaders`)
**Returns:** NIP-94 file metadata tags
