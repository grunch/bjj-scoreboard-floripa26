# Authentication

## Overview

Authentication in the BJJ Scoreboard uses the **Nostr protocol** identity system. Users are identified by their Nostr keypair (public/private keys). The app supports three login methods:

1. **NIP-07 Browser Extension** — Recommended (nos2x, Alby, Nostr Connect, etc.)
2. **nsec Secret Key** — Direct key input
3. **NIP-46 Bunker** — Remote signing via `bunker://` URI

## Login Flow

```text
┌─────────────┐    ┌──────────────┐    ┌───────────────────┐
│ LoginArea   │───▶│ LoginDialog  │───▶│ useLoginActions    │
│ (not logged)│    │ (3 tabs)     │    │ .extension()       │
└─────────────┘    └──────────────┘    │ .nsec(key)         │
                                       │ .bunker(uri)       │
                                       └────────┬──────────┘
                                                │
                                       ┌────────▼──────────┐
                                       │ NostrLoginProvider │
                                       │ (localStorage)     │
                                       │ addLogin(login)    │
                                       └────────┬──────────┘
                                                │
                                       ┌────────▼──────────┐
                                       │ useCurrentUser     │
                                       │ user.pubkey        │
                                       │ user.signer        │
                                       └───────────────────┘
```

## Login Methods

### 1. NIP-07 Browser Extension

**File:** `src/hooks/useLoginActions.ts`

```typescript
async extension(): Promise<void> {
  const login = await NLogin.fromExtension();
  addLogin(login);
}
```

**Flow:**
1. Check if `window.nostr` exists (NIP-07 interface)
2. Call `NLogin.fromExtension()` which prompts the extension for the public key
3. The extension manages the private key — the app never sees it
4. Signing happens through the extension's `window.nostr.signEvent()` method

### 2. nsec Secret Key

```typescript
nsec(nsec: string): void {
  const login = NLogin.fromNsec(nsec);
  addLogin(login);
}
```

**Validation:** `nsec` must match `/^nsec1[a-zA-Z0-9]{58}$/`

**Flow:**
1. User enters nsec key (bech32-encoded private key)
2. `NLogin.fromNsec()` derives the public key
3. Key stored in `@nostrify/react/login` localStorage
4. Signing happens locally with the stored private key

**File upload variant:** Users can also upload a key file (e.g., exported from Amber wallet).

### 3. NIP-46 Bunker

```typescript
async bunker(uri: string): Promise<void> {
  const login = await NLogin.fromBunker(uri, nostr);
  addLogin(login);
}
```

**Validation:** URI must start with `bunker://`

**Flow:**
1. User enters `bunker://` URI
2. `NLogin.fromBunker()` establishes connection to remote signer
3. Signing requests are sent to the bunker via Nostr relay messages
4. The private key never leaves the bunker device

## Session Management

### Login State Storage

Login state is managed by `@nostrify/react/login` (`NostrLoginProvider`) and persisted in localStorage. The storage key is `nostr-login-floripa26-bjj`.

### User Object

The `useCurrentUser()` hook returns:

```typescript
{
  user: NUser | undefined;    // Active user with signer
  users: NUser[];             // All logged-in accounts
  metadata: NostrMetadata;    // Fetched kind 0 profile data
  event: NostrEvent;          // Raw kind 0 event
}
```

The `NUser` object provides a `signer` interface used for:
- Signing events (`user.signer.signEvent()`)
- Encrypting/decrypting DMs
- NIP-98 HTTP authentication

### Multi-Account Support

The app supports multiple logged-in accounts:
- `useLoggedInAccounts()` lists all accounts with their profiles
- `AccountSwitcher` component allows switching between accounts
- First login in the array is the active user

### Logout

```typescript
async logout(): Promise<void> {
  const login = logins[0];
  if (login) {
    removeLogin(login.id);
  }
}
```

## Post-Login Sync

After login, `NostrSync` automatically:
1. Queries kind 10002 (NIP-65) for the user's relay list
2. Parses relay URLs and read/write permissions
3. Updates the app's relay configuration if the event is newer

## Key Management Security

- **NIP-07 extension:** Most secure — key never enters the app
- **nsec direct:** Key is stored in localStorage (encrypted by @nostrify/react)
- **Bunker:** Key stays on remote device; only signing requests are sent
- The app adds a `client` tag to published events (hostname-based) for identification

## Signup Flow

**File:** `src/components/auth/SignupDialog.tsx`

New users can generate a keypair:
1. Generate new private key using `nostr-tools`
2. Display nsec (private) and npub (public) to user
3. User must save their nsec — it cannot be recovered
4. After saving, the nsec is used to log in
