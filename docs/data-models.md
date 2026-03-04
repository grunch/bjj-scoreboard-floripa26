# Data Models

## Core Types

### MatchEvent

**File:** `src/hooks/useMatches.ts`
**Purpose:** Represents a parsed BJJ match from a kind 31415 Nostr event.

```typescript
export type MatchEvent = {
  id: string;           // Match identifier (from d-tag or content.id)
  status: string;       // "waiting" | "in-progress" | "finished" | "canceled"
  start_at?: number;    // Unix timestamp when match started (undefined for waiting)
  duration: number;     // Match duration in seconds (default: 300)
  
  f1_name: string;      // Fighter 1 display name (default: "Fighter 1")
  f2_name: string;      // Fighter 2 display name (default: "Fighter 2")
  f1_color?: string;    // Fighter 1 panel color (hex, e.g., "#1B4D3E")
  f2_color?: string;    // Fighter 2 panel color (hex, e.g., "#FFFFFF")
  
  // Point counts (NOT totals — multiply by face value for total)
  f1_pt2: number;       // Fighter 1: count of 2-point actions (default: 0)
  f2_pt2: number;       // Fighter 2: count of 2-point actions
  f1_pt3: number;       // Fighter 1: count of 3-point actions
  f2_pt3: number;       // Fighter 2: count of 3-point actions
  f1_pt4: number;       // Fighter 1: count of 4-point actions
  f2_pt4: number;       // Fighter 2: count of 4-point actions
  
  // Advantages and penalties
  f1_adv: number;       // Fighter 1 advantages (default: 0)
  f2_adv: number;       // Fighter 2 advantages
  f1_pen: number;       // Fighter 1 penalties (default: 0)
  f2_pen: number;       // Fighter 2 penalties
  
  // Metadata from the Nostr event envelope
  created_at?: number;  // Event created_at timestamp
  pubkey?: string;      // Event author's hex pubkey
};
```

### CardMode

**File:** `src/components/MatchCard.tsx`

```typescript
export type CardMode = 'compact' | 'broadcast';
```

## App Configuration Types

### AppConfig

**File:** `src/contexts/AppContext.ts`

```typescript
export type Theme = "dark" | "light" | "system";

export interface RelayMetadata {
  relays: { url: string; read: boolean; write: boolean }[];
  updatedAt: number;  // Unix timestamp of last update
}

export interface AppConfig {
  theme: Theme;
  relayMetadata: RelayMetadata;
}

export interface AppContextType {
  config: AppConfig;
  updateConfig: (updater: (currentConfig: Partial<AppConfig>) => Partial<AppConfig>) => void;
}
```

## Authentication Types

### NWCConnection

**File:** `src/hooks/useNWC.ts`

```typescript
export interface NWCConnection {
  connectionString: string;   // nostr+walletconnect:// URI
  alias?: string;             // Display name (default: "NWC Wallet")
  isConnected: boolean;       // Connection status
  client?: LN;                // @getalby/sdk LN client instance
}

export interface NWCInfo {
  alias?: string;
  color?: string;
  pubkey?: string;
  network?: string;
  methods?: string[];
  notifications?: string[];
}
```

### Account

**File:** `src/hooks/useLoggedInAccounts.ts`

```typescript
export interface Account {
  id: string;                  // Login ID
  pubkey: string;              // Hex public key
  event?: NostrEvent;          // Kind 0 metadata event
  metadata: NostrMetadata;     // Parsed profile metadata
}
```

### WalletStatus

**File:** `src/hooks/useWallet.ts`

```typescript
export interface WalletStatus {
  hasNWC: boolean;
  webln: WebLNProvider | null;
  activeNWC: NWCConnection | null;
  preferredMethod: 'nwc' | 'webln' | 'manual';
}
```

## DM Types

### DMContext Types

**File:** `src/contexts/DMContext.ts`

```typescript
interface DecryptedMessage extends NostrEvent {
  decryptedContent?: string;
  error?: string;
  isSending?: boolean;
  clientFirstSeen?: number;
  decryptedEvent?: NostrEvent;     // Inner event for NIP-17
  originalGiftWrapId?: string;     // Gift wrap ID for deduplication
}

interface ParticipantData {
  messages: DecryptedMessage[];
  lastActivity: number;
  lastMessage: DecryptedMessage | null;
  hasNIP4: boolean;
  hasNIP17: boolean;
}

interface ConversationSummary {
  id: string;
  pubkey: string;
  lastMessage: DecryptedMessage | null;
  lastActivity: number;
  hasNIP4Messages: boolean;
  hasNIP17Messages: boolean;
  isKnown: boolean;
  isRequest: boolean;
  lastMessageFromUser: boolean;
}

interface FileAttachment {
  url: string;
  mimeType: string;
  size: number;
  name: string;
  tags: string[][];    // NIP-94 file metadata tags
}
```

### Message Protocol Constants

**File:** `src/lib/dmConstants.ts`

```typescript
export const MESSAGE_PROTOCOL = {
  NIP04: 'nip04',
  NIP17: 'nip17',
  UNKNOWN: 'unknown',
} as const;

export type MessageProtocol = typeof MESSAGE_PROTOCOL[keyof typeof MESSAGE_PROTOCOL];

export const PROTOCOL_MODE = {
  NIP04_ONLY: 'nip04_only',
  NIP17_ONLY: 'nip17_only',
  NIP04_OR_NIP17: 'nip04_or_nip17',
} as const;

export const LOADING_PHASES = {
  IDLE: 'idle',
  CACHE: 'cache',
  RELAYS: 'relays',
  SUBSCRIPTIONS: 'subscriptions',
  READY: 'ready',
} as const;

export const PROTOCOL_CONFIG = {
  nip04: { label: 'NIP-04', description: 'Legacy DMs', kind: 4 },
  nip17: { label: 'NIP-17', description: 'Private DMs', kind: 1059 },
  unknown: { label: 'Unknown', description: 'Unknown protocol', kind: 0 },
};
```

## IndexedDB Schema

**File:** `src/lib/dmMessageStore.ts`

```typescript
// DB: nostr-dm-store-{hostname}
// Version: 1
// Store: "messages" (key-value, key = userPubkey)

interface StoredParticipant {
  messages: NostrEvent[];      // Original encrypted events
  lastActivity: number;
  hasNIP4: boolean;
  hasNIP17: boolean;
}

export interface MessageStore {
  participants: Record<string, StoredParticipant>;
  lastSync: {
    nip4: number | null;
    nip17: number | null;
  };
}
```

## Shakespeare AI Types

**File:** `src/hooks/useShakespeare.ts`

```typescript
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface Model {
  id: string;
  name: string;
  description: string;
  object: string;
  owned_by: string;
  created: number;
  context_window: number;
  pricing: { prompt: string; completion: string };
}
```

## Nostr Event JSON Examples

### Kind 31415 — BJJ Match (Waiting)

```json
{
  "id": "abc123...",
  "pubkey": "def456...",
  "created_at": 1709571000,
  "kind": 31415,
  "tags": [
    ["d", "g7h8"]
  ],
  "content": "{\"id\":\"g7h8\",\"status\":\"waiting\",\"duration\":600,\"f1_name\":\"Gordon Ryan\",\"f2_name\":\"Felipe Pena\",\"f1_color\":\"#000000\",\"f2_color\":\"#1BA34E\",\"f1_pt2\":0,\"f2_pt2\":0,\"f1_pt3\":0,\"f2_pt3\":0,\"f1_pt4\":0,\"f2_pt4\":0,\"f1_adv\":0,\"f2_adv\":0,\"f1_pen\":0,\"f2_pen\":0}",
  "sig": "..."
}
```

### Kind 31415 — BJJ Match (In-Progress, Updated Scores)

```json
{
  "id": "xyz789...",
  "pubkey": "def456...",
  "created_at": 1709571200,
  "kind": 31415,
  "tags": [
    ["d", "a1b2"],
    ["expiration", "1710176000"]
  ],
  "content": "{\"id\":\"a1b2\",\"status\":\"in-progress\",\"start_at\":1709571020,\"duration\":300,\"f1_name\":\"Roger Gracie\",\"f2_name\":\"Buchecha\",\"f1_color\":\"#1B4D3E\",\"f2_color\":\"#FFFFFF\",\"f1_pt2\":2,\"f2_pt2\":0,\"f1_pt3\":1,\"f2_pt3\":0,\"f1_pt4\":0,\"f2_pt4\":0,\"f1_adv\":3,\"f2_adv\":1,\"f1_pen\":0,\"f2_pen\":1}",
  "sig": "..."
}
```

### Kind 0 — User Metadata

```json
{
  "id": "...",
  "pubkey": "def456...",
  "created_at": 1709500000,
  "kind": 0,
  "tags": [],
  "content": "{\"name\":\"BJJ Tournament Organizer\",\"about\":\"Running tournaments in Floripa\",\"picture\":\"https://example.com/avatar.jpg\",\"lud16\":\"organizer@getalby.com\"}",
  "sig": "..."
}
```

### Kind 10002 — Relay List

```json
{
  "id": "...",
  "pubkey": "def456...",
  "created_at": 1709400000,
  "kind": 10002,
  "tags": [
    ["r", "wss://relay.mostro.network"],
    ["r", "wss://nos.lol"],
    ["r", "wss://relay.damus.io", "read"]
  ],
  "content": "",
  "sig": "..."
}
```
