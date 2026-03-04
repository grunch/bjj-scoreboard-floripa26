# BJJ Live Scoreboard — Technical Documentation

## Overview

BJJ Live Scoreboard is a **decentralized, real-time Brazilian Jiu-Jitsu match scoring application** built on the [Nostr protocol](https://nostr.com). It enables tournament organizers to publish live match scores, and spectators to watch matches update in real time — all without any centralized server.

### Purpose

- **Tournament organizers** publish match data as Nostr events (kind `31415`)
- **Spectators** subscribe to an organizer's public key and see live scores, timers, advantages, and penalties
- **No accounts required for viewing** — just enter an organizer's `npub` or hex pubkey
- The system is **censorship-resistant** — match data is distributed across multiple Nostr relays

### Key Features

- Real-time match score display with live countdown timers
- Support for BJJ scoring: 2pt, 3pt, 4pt moves, advantages, and penalties
- Match lifecycle: waiting → in-progress → finished / canceled
- Two display modes: compact (list) and broadcast (full-screen TV/projector)
- Dark/light theme support
- Debug mode with 8 hardcoded demo matches
- NIP-07 browser extension login support
- NWC (Nostr Wallet Connect) integration for Lightning payments/zaps

### Architecture Summary

```
┌─────────────────────────────────────────────────┐
│                   React SPA                      │
│  (Vite + React 18 + TypeScript + TailwindCSS)   │
├─────────────────────────────────────────────────┤
│  Pages: HomeScreen, MatchDetail, NIP19Page       │
│  Components: MatchCard, ThemeToggle, Auth, etc.  │
│  Hooks: useMatches, useCurrentUser, useNWC, etc. │
├─────────────────────────────────────────────────┤
│          @nostrify/nostrify + nostr-tools         │
│      (Nostr protocol, signing, relay pool)        │
├─────────────────────────────────────────────────┤
│        NPool → NRelay1 (WebSocket per relay)      │
│     wss://relay.mostro.network                    │
│     wss://nos.lol                                 │
│     wss://relay.damus.io                          │
└─────────────────────────────────────────────────┘
```

### Documentation Index

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | System architecture, tech stack, project structure, data flow |
| [Nostr Protocol](./nostr-protocol.md) | NIPs, event kinds, event structure, relay communication |
| [Scoring System](./scoring-system.md) | BJJ scoring rules, point system, advantages, penalties |
| [Match Lifecycle](./match-lifecycle.md) | Match states, transitions, timer logic |
| [Components](./components.md) | Every React component documented |
| [Data Models](./data-models.md) | TypeScript types/interfaces, event schemas |
| [Authentication](./authentication.md) | Auth flow, NIP-07, key management |
| [API & Relay](./api-and-relay.md) | Relay config, subscriptions, event publishing |
| [UI Screens](./ui-screens.md) | Every page/screen documented |
| [State Management](./state-management.md) | React Query, contexts, localStorage |
