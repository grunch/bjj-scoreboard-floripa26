# React Components

## Core Components

### MatchCard

**File:** `src/components/MatchCard.tsx`
**Purpose:** Renders a single match score card with fighter names, scores, timer, advantages, and penalties.

**Props:**
```typescript
interface MatchCardProps {
  match: MatchEvent;          // Match data
  onOpen: (id: string) => void; // Callback when card is clicked
  mode?: CardMode;            // 'compact' (default) or 'broadcast'
}

type CardMode = 'compact' | 'broadcast';
```

**Behavior:**
- Calculates total score: `pt2 * 2 + pt3 * 3 + pt4 * 4`
- Determines winning fighter and shows trophy icon
- Shows live countdown timer for in-progress matches
- Applies color-coded panels per fighter (`f1_color`, `f2_color`)
- Computes text contrast color (black/white) automatically based on background luminance
- In broadcast mode: much larger text, padding, and scores for TV/projector display
- Four-segment bottom strip: F1 Advantages (gold), F1 Penalties (red), F2 Advantages (gold), F2 Penalties (red)

**Internal Hook — `useElapsed`:**
```typescript
function useElapsed(match: MatchEvent) {
  // Returns { elapsed, remaining } or null
  // Only active for 'in-progress' matches
  // Updates every 1 second via setInterval
}
```

**Helper Functions:**
- `formatTime(seconds)` — Converts seconds to `M:SS` format
- `contrastText(hex, fallbackDark)` — Returns `#121A2E` or `#FFFFFF` based on luminance
- `getStatusBadge(status, bc)` — Returns JSX badge with appropriate icon and style

### NostrProvider

**File:** `src/components/NostrProvider.tsx`
**Purpose:** Creates and provides the `NPool` Nostr relay pool to all child components.

**Behavior:**
- Creates `NPool` once (using `useRef`)
- Routes REQ filters to all **read** relays
- Routes EVENT publishing to all **write** relays
- EOSE timeout: 200ms
- Invalidates React Query Nostr queries when relay metadata changes

**Pool Configuration:**
```typescript
new NPool({
  open(url) { return new NRelay1(url); },
  reqRouter(filters) {
    // Send to all read relays
    const readRelays = relayMetadata.relays.filter(r => r.read);
    return new Map(readRelays.map(r => [r.url, filters]));
  },
  eventRouter(event) {
    // Send to all write relays
    return relayMetadata.relays.filter(r => r.write).map(r => r.url);
  },
  eoseTimeout: 200,
});
```

### NostrSync

**File:** `src/components/NostrSync.tsx`
**Purpose:** Background component that syncs the user's NIP-65 relay list on login.

**Behavior:**
1. Triggers on user login
2. Queries kind 10002 for the user's pubkey
3. Parses `r` tags into relay list with read/write permissions
4. Updates app config if the event is newer than stored data

### AppProvider

**File:** `src/components/AppProvider.tsx`
**Purpose:** Manages app-wide configuration (theme, relay metadata) with localStorage persistence.

**Props:**
```typescript
interface AppProviderProps {
  children: ReactNode;
  storageKey: string;           // localStorage key
  defaultConfig: AppConfig;     // Fallback configuration
}
```

**Behavior:**
- Uses `useLocalStorage` with Zod validation on deserialization
- Merges stored config with defaults
- Applies theme class to `document.documentElement`
- Listens for system theme changes when theme is `"system"`

### ErrorBoundary

**File:** `src/components/ErrorBoundary.tsx`
**Purpose:** React error boundary that catches rendering errors.

**Behavior:**
- Catches errors in child component tree
- Shows error message with expandable stack trace
- Provides "Try again" (reset state) and "Reload page" buttons

### ThemeToggle

**File:** `src/components/ThemeToggle.tsx`
**Purpose:** Dark/light mode toggle button.

**Behavior:**
- Shows Sun icon in dark mode, Moon in light mode
- Toggles between `dark` and `light` (no `system` option in toggle)
- Wrapped in a tooltip

### ScrollToTop

**File:** `src/components/ScrollToTop.tsx`
**Purpose:** Scrolls to top of page on route changes.

## Authentication Components

### LoginArea

**File:** `src/components/auth/LoginArea.tsx`
**Purpose:** Conditional login/account UI.

**Behavior:**
- If logged in: shows `AccountSwitcher`
- If not logged in: shows "Log in" and "Sign up" buttons
- Opens `LoginDialog` or `SignupDialog` modals

### LoginDialog

**File:** `src/components/auth/LoginDialog.tsx`
**Purpose:** Modal with three login methods in tabs.

**Tabs:**
1. **Extension** (NIP-07) — Detects browser extension, calls `login.extension()`
2. **Secret Key** — Input for `nsec1...` key, validates format, calls `login.nsec()`
3. **Bunker** — Input for `bunker://` URI, calls `login.bunker()`

**Also supports:** File upload of nsec key file (for Amber exports).

### SignupDialog

**File:** `src/components/auth/SignupDialog.tsx`
**Purpose:** Generates a new Nostr keypair and displays it for the user to save.

### AccountSwitcher

**File:** `src/components/auth/AccountSwitcher.tsx`
**Purpose:** Dropdown to switch between logged-in accounts or add new ones.

## Profile & Settings Components

### EditProfileForm

**File:** `src/components/EditProfileForm.tsx`
**Purpose:** Form to edit Nostr profile metadata (kind 0).

**Fields:** name, about, picture, banner, website, nip05, bot
**Features:** File upload for picture/banner via Blossom uploader

### RelayListManager

**File:** `src/components/RelayListManager.tsx`
**Purpose:** UI for managing the user's Nostr relay list.

## Payment Components

### ZapButton

**File:** `src/components/ZapButton.tsx`
**Purpose:** Lightning bolt button that opens the zap dialog.

### ZapDialog

**File:** `src/components/ZapDialog.tsx`
**Purpose:** Dialog for entering zap amount and comment, with QR code fallback.

### WalletModal

**File:** `src/components/WalletModal.tsx`
**Purpose:** NWC wallet connection management UI.

## Messaging Components

### DMProvider

**File:** `src/components/DMProvider.tsx`
**Purpose:** State management provider for direct messaging (NIP-04/NIP-17).

### DMMessagingInterface

**File:** `src/components/dm/DMMessagingInterface.tsx`
**Purpose:** Chat interface for direct messaging.

## UI Component Library (shadcn/ui)

The `src/components/ui/` directory contains shadcn/ui components built on Radix UI primitives:

accordion, alert, alert-dialog, avatar, badge, breadcrumb, button, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip
