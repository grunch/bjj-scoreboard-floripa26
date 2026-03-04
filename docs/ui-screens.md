# UI Screens

## Route Map

| Path | Page Component | Description |
|------|---------------|-------------|
| `/` | `Index` → `HomeScreen` | Main scoreboard landing page |
| `/match/:matchId` | `MatchDetail` | Individual match detail view |
| `/messages` | `Messages` | Direct messaging interface |
| `/:nip19` | `NIP19Page` | NIP-19 entity decoder (placeholder) |
| `*` | `NotFound` | 404 page |

## 1. Home Screen (Scoreboard)

**File:** `src/pages/HomeScreen.tsx`
**Route:** `/`

### Layout

```
┌──────────────────────────────────────────────────────┐
│  🥋 BJJ Floripa 2026                    [🌙] [Login] │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ Enter organizer's Nostr public key           │    │
│  │ [npub or hex input_______________] [Load]    │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  View mode: [Compact] [Broadcast]                    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ MatchCard 1 (LIVE)                            │    │
│  │ Roger Gracie  [4:58]  Buchecha               │    │
│  │     7         LIVE         0                  │    │
│  │ Adv:3  Pen:0  |  Adv:1  Pen:1               │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ MatchCard 2 (Waiting)                         │    │
│  │ Gordon Ryan  [10:00]  Felipe Pena            │    │
│  │     0       Waiting        0                  │    │
│  │ Adv:0  Pen:0  |  Adv:0  Pen:0               │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ... more match cards ...                            │
└──────────────────────────────────────────────────────┘
```

### Features

1. **Pubkey Input:** Text field for entering organizer's `npub` or hex pubkey
2. **Load Button:** Starts subscription to the organizer's kind 31415 events
3. **View Mode Toggle:** Switch between `compact` (default) and `broadcast` modes
4. **Match Cards:** List of all matches from the organizer, sorted newest first
5. **Loading State:** Shows spinner while fetching initial events
6. **Empty State:** Shows message when no matches found
7. **Debug Mode:** Option to load 8 demo matches without relay connection
8. **Theme Toggle:** Dark/light mode button in header
9. **Login Area:** Login/signup buttons or account switcher

### Broadcast Mode

Designed for TV/projector display:
- Much larger scores (10rem-14rem font size)
- Larger timer (5xl)
- More padding and spacing
- Ideal for tournament venue screens

### User Interactions

- Enter pubkey → Load matches
- Click match card → Navigate to `/match/:matchId`
- Toggle view mode → Switches card rendering
- Toggle theme → Dark/light mode
- Login → Opens login dialog

## 2. Match Detail

**File:** `src/pages/MatchDetail.tsx`
**Route:** `/match/:matchId`

### Features

- Full-screen display of a single match
- Larger score display than compact card view
- Real-time updates continue via subscription
- Back navigation to home screen

## 3. Messages

**File:** `src/pages/Messages.tsx`
**Route:** `/messages`

### Features

- Direct messaging interface
- Supports NIP-04 and NIP-17 encrypted messages
- Conversation list with last message preview
- Message thread view with pagination
- File attachment support via Blossom upload
- Requires login

## 4. NIP-19 Entity Page

**File:** `src/pages/NIP19Page.tsx`
**Route:** `/:nip19`

### Features

- Decodes NIP-19 entities (npub, note, nevent, naddr)
- Currently a placeholder/minimal implementation

## 5. Not Found (404)

**File:** `src/pages/NotFound.tsx`
**Route:** `*` (catch-all)

### Features

- Simple 404 error page
- Link to navigate back to home

## Visual Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Navy | `#121A2E` (hsl 220 45% 12%) | Card headers, dark backgrounds |
| Green | `#1BA34E` (hsl 145 72% 35%) | Primary, live badges, ring glow |
| Gold | `#F5B800` (hsl 45 100% 48%) | Accent, advantages, timer warning |
| Red | `#C0392B` | Penalties, destructive actions |
| White | `#FFFFFF` | Light backgrounds, text on dark |

### Animations

| Animation | CSS Class | Duration | Usage |
|-----------|----------|----------|-------|
| Live pulse | `animate-pulse-live` | 1.5s | Winning score panel, timer warning |
| Green glow | `animate-glow-green` | 2s | Live match card border |
| Bounce | `animate-bounce` | 2s | Trophy icon on winning side |
| Ping | `animate-ping` | default | Live badge dot |

### Typography

- **Font Family:** Outfit Variable, Inter Variable, system-ui
- **Score Numbers:** `font-black font-mono` (monospace, heavy weight)
- **Timer:** `font-bold font-mono tracking-wider`
- **Labels:** `font-semibold uppercase tracking-wider`

### Responsive Breakpoints

- Mobile: < 768px (`useIsMobile` hook)
- Desktop: ≥ 768px
- 2xl container: 1400px max width
