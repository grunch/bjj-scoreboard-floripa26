# System Architecture

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | React | 18.3.1 | UI framework |
| **Language** | TypeScript | ~5.6.2 | Type safety |
| **Build** | Vite | 6.0.5 | Dev server + bundler |
| **Styling** | TailwindCSS | 3.4.17 | Utility-first CSS |
| **Routing** | React Router | 7.1.1 | Client-side routing |
| **State** | TanStack React Query | 5.62.8 | Server state + caching |
| **Nostr** | @nostrify/nostrify | 2.0.1 | Nostr protocol library |
| **Nostr React** | @nostrify/react | 2.0.1 | React hooks for Nostr |
| **Crypto** | nostr-tools | 2.12.0 | Key generation, NIP encoding, zap requests |
| **Forms** | react-hook-form + zod | 7.54.2 / 3.24.1 | Form validation |
| **UI Components** | Radix UI | various | Accessible UI primitives |
| **Icons** | lucide-react | 0.469.0 | Icon library |
| **SEO** | @unhead/react | 1.11.20 | Meta tag management |
| **DB** | idb (IndexedDB) | 8.0.2 | Client-side message caching |
| **Lightning** | @getalby/sdk | 4.2.1 | NWC wallet connection |
| **Testing** | Vitest + @testing-library | 3.0.4 | Unit/component tests |

## Project Structure

```
bjj-scoreboard-floripa26/
├── index.html                    # Entry HTML (CSP headers, root mount)
├── package.json                  # Dependencies and scripts
├── vite.config.ts                # Vite config (port 8080, path aliases)
├── tsconfig.json                 # TypeScript config (ES2020, bundler mode)
├── tailwind.config.ts            # Tailwind config (dark mode, custom colors)
├── public/
│   └── manifest.webmanifest      # PWA manifest
├── src/
│   ├── main.tsx                  # App entry point (polyfills, providers)
│   ├── App.tsx                   # Provider stack (AppProvider, NostrProvider, etc.)
│   ├── AppRouter.tsx             # Route definitions
│   ├── index.css                 # Global styles + BJJ theme variables
│   ├── contexts/
│   │   ├── AppContext.ts         # Theme + relay metadata context
│   │   ├── DMContext.ts          # Direct messaging context type
│   │   └── NWCContext.tsx        # NWC provider wrapper
│   ├── hooks/
│   │   ├── useMatches.ts         # ⭐ Core: Live match subscription (kind 31415)
│   │   ├── useCurrentUser.ts     # Current logged-in user
│   │   ├── useAuthor.ts          # Nostr profile metadata (kind 0)
│   │   ├── useAppContext.ts      # App config access
│   │   ├── useLocalStorage.ts    # Generic localStorage hook
│   │   ├── useLoginActions.ts    # Login methods (nsec, bunker, extension)
│   │   ├── useLoggedInAccounts.ts # Multi-account management
│   │   ├── useNostrPublish.ts    # Event publishing mutation
│   │   ├── useTheme.ts           # Theme toggle
│   │   ├── useNWC.ts             # NWC internal state
│   │   ├── useNWCContext.ts       # NWC context consumer
│   │   ├── useWallet.ts          # Wallet status (NWC/WebLN)
│   │   ├── useZaps.ts            # Zap sending + receipt queries
│   │   ├── useComments.ts        # NIP-22 comments (kind 1111)
│   │   ├── usePostComment.ts     # NIP-22 comment publishing
│   │   ├── useShakespeare.ts     # AI chat via Shakespeare API (NIP-98)
│   │   ├── useConversationMessages.ts # Paginated DM access
│   │   ├── useDMContext.ts       # DM context consumer
│   │   ├── useUploadFile.ts      # Blossom file upload
│   │   ├── useIsMobile.tsx       # Responsive breakpoint
│   │   ├── useToast.ts           # Toast notifications
│   │   └── useNostr.ts           # Re-export of @nostrify/react
│   ├── lib/
│   │   ├── debugMatches.ts       # 8 hardcoded demo matches
│   │   ├── publishDebug.ts       # Publish debug matches to relays
│   │   ├── utils.ts              # cn() utility (clsx + tailwind-merge)
│   │   ├── polyfills.ts          # Buffer, AbortSignal.any/timeout polyfills
│   │   ├── dmConstants.ts        # DM protocol types (NIP-04, NIP-17)
│   │   ├── dmMessageStore.ts     # IndexedDB CRUD for DM cache
│   │   ├── dmUtils.ts            # DM helpers (validation, time formatting)
│   │   └── genUserName.ts        # Deterministic username from pubkey hash
│   ├── pages/
│   │   ├── Index.tsx             # Landing page (wraps HomeScreen + SEO)
│   │   ├── HomeScreen.tsx        # ⭐ Main scoreboard page
│   │   ├── MatchDetail.tsx       # Individual match detail view
│   │   ├── Messages.tsx          # DM messaging page
│   │   ├── NIP19Page.tsx         # NIP-19 entity decoder (placeholder)
│   │   └── NotFound.tsx          # 404 page
│   └── components/
│       ├── MatchCard.tsx          # ⭐ Core: Match score display card
│       ├── ThemeToggle.tsx        # Dark/light mode toggle
│       ├── ScrollToTop.tsx        # Scroll reset on navigation
│       ├── ErrorBoundary.tsx      # React error boundary
│       ├── NostrProvider.tsx      # NPool configuration
│       ├── NostrSync.tsx          # NIP-65 relay list sync
│       ├── AppProvider.tsx        # App config + theme provider
│       ├── EditProfileForm.tsx    # Nostr profile editor
│       ├── NoteContent.tsx        # Note content renderer
│       ├── RelayListManager.tsx   # Relay settings UI
│       ├── WalletModal.tsx        # NWC wallet connection UI
│       ├── ZapButton.tsx          # Lightning zap button
│       ├── ZapDialog.tsx          # Zap amount dialog
│       ├── DMProvider.tsx         # DM state management provider
│       ├── auth/
│       │   ├── LoginArea.tsx      # Login/signup toggle area
│       │   ├── LoginDialog.tsx    # Login modal (nsec, bunker, NIP-07)
│       │   ├── SignupDialog.tsx   # New account creation
│       │   └── AccountSwitcher.tsx # Multi-account UI
│       ├── dm/
│       │   └── DMMessagingInterface.tsx # DM chat interface
│       └── ui/                    # shadcn/ui components (Button, Card, etc.)
```

## Data Flow

### Scoreboard Data Flow (Read-Only for Spectators)

```
                                  ┌─────────────────┐
                                  │ Tournament       │
                                  │ Organizer App    │
                                  │ (external)       │
                                  └────────┬─────────┘
                                           │
                                  Publishes kind 31415
                                  events to Nostr relays
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │     Nostr Relays        │
                              │  (nos.lol, damus, etc.) │
                              └────────────┬───────────┘
                                           │
                                  WebSocket subscription
                                  (REQ with filter)
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    BJJ Scoreboard App                         │
│                                                              │
│  ┌──────────┐    ┌───────────┐    ┌──────────────────────┐  │
│  │HomeScreen│───▶│useMatches │───▶│ NPool (relay pool)    │  │
│  │          │    │  hook     │    │ → NRelay1 per relay   │  │
│  └────┬─────┘    └─────┬─────┘    └──────────────────────┘  │
│       │                │                                     │
│       │         Parse events                                 │
│       │         Dedup by d-tag                               │
│       │         Sort by created_at                           │
│       │                │                                     │
│       ▼                ▼                                     │
│  ┌──────────┐   MatchEvent[]                                │
│  │MatchCard │◀──────────┘                                   │
│  │(per match)│                                               │
│  └──────────┘                                                │
└──────────────────────────────────────────────────────────────┘
```

### Provider Stack (Component Tree)

```
<React.StrictMode>
  <QueryClientProvider>          ← TanStack React Query
    <AppProvider>                ← Theme + relay metadata (localStorage)
      <NostrLoginProvider>       ← Login state (localStorage)
        <NostrProvider>          ← NPool relay connections
          <NWCProvider>          ← NWC wallet connections
            <TooltipProvider>
              <NostrSync />      ← Syncs NIP-65 relay list on login
              <AppRouter />      ← React Router routes
              <Toaster />        ← Toast notifications
            </TooltipProvider>
          </NWCProvider>
        </NostrProvider>
      </NostrLoginProvider>
    </AppProvider>
  </QueryClientProvider>
</React.StrictMode>
```

### Default Relay Configuration

```typescript
const DEFAULT_RELAYS = [
  { url: 'wss://relay.mostro.network', read: true, write: true },
  { url: 'wss://nos.lol', read: true, write: true },
  { url: 'wss://relay.damus.io', read: true, write: true },
];
```

## Build & Run

```bash
npm install
npm run dev      # Development server on port 8080
npm run build    # Production build to dist/
npm run preview  # Preview production build
npm test         # Run Vitest tests
```
