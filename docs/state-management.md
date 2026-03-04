# State Management

## Overview

The app uses a layered state management approach:

```
┌─────────────────────────────────────────────┐
│         React Query (TanStack)              │
│  Server state: Nostr events, profiles,      │
│  zaps, comments                             │
├─────────────────────────────────────────────┤
│         React Context                        │
│  App config, DM state, NWC connections      │
├─────────────────────────────────────────────┤
│         localStorage                         │
│  Theme, relay list, NWC URIs, login state   │
├─────────────────────────────────────────────┤
│         IndexedDB                            │
│  DM message cache                           │
├─────────────────────────────────────────────┤
│         Component Local State                │
│  UI state: dialogs, inputs, timers          │
└─────────────────────────────────────────────┘
```

## React Query (Server State)

**Provider:** `QueryClientProvider` (top of tree in `main.tsx`)

Used for all Nostr data fetching:

### Query Keys

| Key Pattern | Hook | Data |
|-------------|------|------|
| `['nostr', 'author', pubkey]` | `useAuthor` | Kind 0 user metadata |
| `['nostr', 'logins', loginIds]` | `useLoggedInAccounts` | Profile data for logged-in accounts |
| `['nostr', 'zaps', eventId]` | `useZaps` | Kind 9735 zap receipts |
| `['nostr', 'comments', rootId]` | `useComments` | Kind 1111 comments |

### Cache Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| Author stale time | 5 minutes | Avoid refetching profiles frequently |
| Zap stale time | 30 seconds | Keep zap counts relatively fresh |
| Zap refetch interval | 60 seconds | Periodic refresh when observed |
| Author retries | 3 | Handle transient relay failures |

### Mutations

| Mutation | Hook | Effect |
|----------|------|--------|
| Publish event | `useNostrPublish` | Signs and publishes any Nostr event |
| Post comment | `usePostComment` | Creates kind 1111, invalidates comment queries |
| Upload file | `useUploadFile` | Uploads to Blossom server |

## React Context

### AppContext

**Provider:** `AppProvider`
**Storage:** localStorage key `bjj-floripa26-config`

```typescript
interface AppConfig {
  theme: Theme;              // 'dark' | 'light' | 'system'
  relayMetadata: RelayMetadata; // Relay list + updatedAt timestamp
}
```

**Access:** `useAppContext()` hook
**Update:** `updateConfig(updater)` with callback pattern

### NostrContext

**Provider:** `NostrProvider`
**Value:** `NPool` instance (created once via `useRef`)

**Access:** `useNostr()` hook → `{ nostr }`

### NostrLoginContext

**Provider:** `NostrLoginProvider` (from `@nostrify/react/login`)
**Storage:** localStorage key `nostr-login-floripa26-bjj`

**Access:** `useNostrLogin()` → `{ logins, addLogin, removeLogin }`

### NWCContext

**Provider:** `NWCProvider` → `NWCContext.Provider`
**Storage:** localStorage keys `nwc-connections`, `nwc-active-connection`

```typescript
// Stored connection data
interface NWCConnection {
  connectionString: string;
  alias?: string;
  isConnected: boolean;
}
```

**Access:** `useNWC()` hook

### DMContext

**Provider:** `DMProvider`
**Storage:** IndexedDB (`nostr-dm-store-{hostname}`)

**Access:** `useDMContext()` hook

## Custom State Hook: `useMatches`

This hook manages its own state outside of React Query because it uses a **persistent WebSocket subscription** (async iterator), which doesn't fit the query/mutation pattern:

```typescript
export function useMatches(pubkey?: string) {
  const [matches, setMatches] = useState<MatchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  
  // Opens persistent subscription
  // Updates state on each new event
  // Deduplicates by match id, keeps newest
  // Aborts on pubkey change or unmount
}
```

**Key behaviors:**
- **Deduplication:** Groups by match id, keeps event with latest `created_at`
- **Sorting:** Newest matches first
- **Cleanup:** AbortController cancels subscription on unmount or pubkey change
- **Real-time:** Subscription stays open after EOSE for live updates

## localStorage Keys

| Key | Content | Hook |
|-----|---------|------|
| `bjj-floripa26-config` | AppConfig (theme, relays) | `useLocalStorage` via `AppProvider` |
| `nostr-login-floripa26-bjj` | Login credentials | `@nostrify/react/login` |
| `nwc-connections` | NWC connection strings | `useNWC` |
| `nwc-active-connection` | Active NWC connection string | `useNWC` |

### useLocalStorage Hook

**File:** `src/hooks/useLocalStorage.ts`

Generic hook for localStorage persistence:

```typescript
function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  serializer?: {
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
  }
): [T, (value: T | ((prev: T) => T)) => void]
```

**Features:**
- Custom serialization/deserialization support
- Cross-tab synchronization via `storage` event listener
- Error handling with fallback to default value

## IndexedDB (DM Cache)

**File:** `src/lib/dmMessageStore.ts`

| Database | `nostr-dm-store-{hostname}` |
|----------|---------------------------|
| Version | 1 |
| Store | `messages` (key-value) |
| Key | User's hex pubkey |
| Value | `MessageStore` object |

### Operations

```typescript
// Write
await writeMessagesToDB(userPubkey, messageStore);

// Read
const store = await readMessagesFromDB(userPubkey);

// Delete
await deleteMessagesFromDB(userPubkey);

// Clear all
await clearAllMessages();
```

## Component Local State

Used for ephemeral UI state that doesn't need persistence:

| Component | State | Purpose |
|-----------|-------|---------|
| `MatchCard` (useElapsed) | `now` timestamp | Timer tick every 1s |
| `HomeScreen` | pubkey input, view mode | Form state |
| `LoginDialog` | nsec/bunker input, errors, loading | Form state |
| `ZapDialog` | amount, comment, invoice | Zap flow state |
| `useZaps` | `isZapping`, `invoice` | Payment flow state |
| `useShakespeare` | `isLoading`, `error` | API request state |

## Data Flow Summary

```
User types pubkey ──▶ HomeScreen state
                          │
                          ▼
                     useMatches(pubkey)
                          │
                     Opens subscription
                          │
                          ▼
                  Nostr Relays (NPool)
                          │
                     Events stream in
                          │
                          ▼
                  parseEvent() + dedup()
                          │
                          ▼
                  setMatches(MatchEvent[])
                          │
                          ▼
                  MatchCard renders each
                          │
                  ┌───────┴────────┐
                  │                │
            Score calc      Timer (useElapsed)
          f1_pt2*2+...     setInterval 1s
```
