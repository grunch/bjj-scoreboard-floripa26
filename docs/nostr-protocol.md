# Nostr Protocol Integration

## NIPs Implemented

| NIP | Name | Usage |
|-----|------|-------|
| **NIP-01** | Basic Protocol | Core event structure, relay communication (REQ, EVENT, EOSE, CLOSED) |
| **NIP-04** | Encrypted DMs | Legacy direct messaging (kind 4) |
| **NIP-07** | Browser Extension | Login via browser extensions (nos2x, Alby, etc.) |
| **NIP-17** | Private DMs | Private direct messaging (kind 1059 gift wraps) |
| **NIP-19** | bech32 Entities | `npub`, `nsec`, `note`, `nevent`, `naddr` encoding/decoding |
| **NIP-22** | Comments | Comments on events (kind 1111) |
| **NIP-40** | Expiration | `expiration` tag on debug-published events |
| **NIP-46** | Nostr Connect (Bunker) | Remote signing via `bunker://` URI |
| **NIP-57** | Lightning Zaps | Zap requests, zap receipts (kind 9735), LNURL |
| **NIP-65** | Relay List Metadata | Syncing user's relay list (kind 10002) |
| **NIP-94** | File Metadata | File attachment tags for uploads |
| **NIP-96** | HTTP File Storage (Blossom) | File uploads to Blossom servers |
| **NIP-98** | HTTP Auth | Authentication for Shakespeare AI API |

## Event Kind: 31415 (BJJ Match)

This is the **core event kind** used for the BJJ scoreboard. It is a **parameterized replaceable event** (kind 30000-39999), meaning events with the same `d` tag from the same author replace each other.

### Event Structure

```json
{
  "id": "<sha256 hash>",
  "pubkey": "<organizer hex pubkey>",
  "created_at": 1709571200,
  "kind": 31415,
  "tags": [
    ["d", "a1b2"],
    ["expiration", "1710176000"]
  ],
  "content": "{\"id\":\"a1b2\",\"status\":\"in-progress\",\"start_at\":1709571020,\"duration\":300,\"f1_name\":\"Roger Gracie\",\"f2_name\":\"Buchecha\",\"f1_color\":\"#1B4D3E\",\"f2_color\":\"#FFFFFF\",\"f1_pt2\":2,\"f2_pt2\":0,\"f1_pt3\":1,\"f2_pt3\":0,\"f1_pt4\":0,\"f2_pt4\":0,\"f1_adv\":3,\"f2_adv\":1,\"f1_pen\":0,\"f2_pen\":1}",
  "sig": "<schnorr signature>"
}
```

### Content JSON Schema

```typescript
interface MatchContent {
  id: string;          // Match identifier (same as d-tag)
  status: string;      // "waiting" | "in-progress" | "finished" | "canceled"
  start_at?: number;   // Unix timestamp when match started
  duration: number;    // Match duration in seconds (e.g., 300 = 5 min)
  
  // Fighter names
  f1_name: string;     // Fighter 1 name
  f2_name: string;     // Fighter 2 name
  
  // Fighter colors (hex)
  f1_color?: string;   // Fighter 1 panel color (e.g., "#1B4D3E")
  f2_color?: string;   // Fighter 2 panel color (e.g., "#FFFFFF")
  
  // Points breakdown (multiplied by value for total score)
  f1_pt2: number;      // Fighter 1: count of 2-point moves
  f2_pt2: number;      // Fighter 2: count of 2-point moves
  f1_pt3: number;      // Fighter 1: count of 3-point moves
  f2_pt3: number;      // Fighter 2: count of 3-point moves
  f1_pt4: number;      // Fighter 1: count of 4-point moves
  f2_pt4: number;      // Fighter 2: count of 4-point moves
  
  // Advantages and penalties
  f1_adv: number;      // Fighter 1 advantages
  f2_adv: number;      // Fighter 2 advantages
  f1_pen: number;      // Fighter 1 penalties
  f2_pen: number;      // Fighter 2 penalties
}
```

### Tags

| Tag | Description | Example |
|-----|-------------|---------|
| `d` | Match identifier (makes it replaceable) | `["d", "a1b2"]` |
| `expiration` | Event expiration (NIP-40) | `["expiration", "1710176000"]` |

### Subscription Filter

```json
{
  "kinds": [31415],
  "authors": ["<organizer_hex_pubkey>"],
  "since": <unix_timestamp_24h_ago>,
  "limit": 1000
}
```

### How Replaceable Events Work

Since kind 31415 is in the 30000-39999 range, it's a **parameterized replaceable event**. When the organizer publishes a new event with the same `d` tag and `pubkey`, relays replace the old one. The app also deduplicates client-side by keeping only the newest `created_at` per match `id`.

## Other Event Kinds Used

### Kind 0 — User Metadata (NIP-01)

Used to fetch user profiles (display name, picture, lud16 for zaps).

```json
{
  "kind": 0,
  "content": "{\"name\":\"Organizer\",\"picture\":\"https://...\",\"lud16\":\"user@getalby.com\"}",
  "tags": []
}
```

### Kind 4 — Encrypted DM (NIP-04)

Legacy encrypted direct messages.

### Kind 1059 — Gift Wrap (NIP-17)

Private direct messages wrapped in gift-wrap events.

### Kind 1111 — Comments (NIP-22)

Comments on match events or other content.

```json
{
  "kind": 1111,
  "content": "Great match!",
  "tags": [
    ["A", "31415:<pubkey>:<d-tag>"],
    ["K", "31415"],
    ["P", "<event_author_pubkey>"],
    ["a", "31415:<pubkey>:<d-tag>"],
    ["k", "31415"],
    ["p", "<event_author_pubkey>"]
  ]
}
```

### Kind 9735 — Zap Receipt (NIP-57)

Zap receipts queried to display zap counts/totals.

### Kind 10002 — Relay List Metadata (NIP-65)

Synced on login to update the user's preferred relay configuration.

```json
{
  "kind": 10002,
  "tags": [
    ["r", "wss://nos.lol"],
    ["r", "wss://relay.damus.io", "read"],
    ["r", "wss://relay.mostro.network", "write"]
  ]
}
```

### Kind 27235 — HTTP Auth (NIP-98)

Used to authenticate requests to the Shakespeare AI API.

## Relay Communication Flow

```
Client                              Relay
  │                                   │
  │── ["REQ", "sub1", {filter}] ─────▶│
  │                                   │
  │◀── ["EVENT", "sub1", event1] ─────│
  │◀── ["EVENT", "sub1", event2] ─────│
  │◀── ["EVENT", "sub1", ...] ────────│
  │◀── ["EOSE", "sub1"] ─────────────│  (End of stored events)
  │                                   │
  │  (real-time: new events arrive)   │
  │◀── ["EVENT", "sub1", eventN] ─────│
  │                                   │
  │── ["CLOSE", "sub1"] ─────────────▶│  (on cleanup/unmount)
  │                                   │
```

The `useMatches` hook uses `nostr.req()` which returns an async iterator. Events arrive one by one. After EOSE, the subscription stays open for real-time updates until the component unmounts (AbortController signal).
