# Match Lifecycle

## Complete Lifecycle Diagram

```text
┌──────────┐     Organizer sets    ┌─────────────┐     Organizer sets    ┌──────────┐
│          │     status:           │             │     status:           │          │
│ WAITING  │────"in-progress"─────▶│ IN-PROGRESS │────"finished"────────▶│ FINISHED │
│          │     + start_at        │             │                       │          │
└──────┬───┘                       └──────┬──────┘                       └──────────┘
       │                                  │
       │     Organizer sets               │     Organizer sets
       │     status: "canceled"           │     status: "canceled"
       │                                  │
       ▼                                  ▼
┌──────────┐                       ┌──────────┐
│ CANCELED │                       │ CANCELED │
└──────────┘                       └──────────┘
```

## State Details

### 1. Waiting

The match has been created but not yet started.

**Event content:**
```json
{
  "id": "match-001",
  "status": "waiting",
  "duration": 300,
  "f1_name": "Gordon Ryan",
  "f2_name": "Felipe Pena",
  "f1_color": "#000000",
  "f2_color": "#1BA34E",
  "f1_pt2": 0, "f2_pt2": 0,
  "f1_pt3": 0, "f2_pt3": 0,
  "f1_pt4": 0, "f2_pt4": 0,
  "f1_adv": 0, "f2_adv": 0,
  "f1_pen": 0, "f2_pen": 0
}
```

**UI behavior:**
- Clock icon badge showing "Waiting"
- Timer displays total match duration (e.g., `5:00`)
- Score panels show `0` for both fighters
- Card is clickable but no animation

### 2. In-Progress

The match is actively being scored.

**Event content changes:**
```json
{
  "status": "in-progress",
  "start_at": 1709571020
}
```

**UI behavior:**
- Green "LIVE" badge with pulsing white dot
- Live countdown timer (computed from `start_at` + `duration` - `now`)
- Elapsed time shown below timer
- Card has green glow animation (`animate-glow-green`)
- Leading fighter's panel pulses
- Trophy icon bounces on leading fighter's side
- Timer turns gold and pulses when ≤ 30 seconds remain

**Real-time updates:**
- As the organizer publishes updated events (score changes), the `useMatches` hook receives them via the WebSocket subscription
- The component re-renders with new scores immediately
- Timer is computed client-side, so no event is needed for timer ticks

### 3. Finished

The match has concluded normally.

**Event content changes:**
```json
{
  "status": "finished"
}
```

**UI behavior:**
- Outlined badge with trophy icon showing "Finished"
- Timer shows `--:--`
- Final scores displayed
- No animations
- Card remains clickable for viewing final results

### 4. Canceled

The match was called off.

**Event content changes:**
```json
{
  "status": "canceled"
}
```

**UI behavior:**
- Outlined badge showing "Canceled"
- Dimmed text (50% opacity)
- Timer shows `--:--`
- All scores at 0 (typically)

## Score Update Flow

```
Tournament Organizer Device
        │
        │ 1. Referee signals score change
        │ 2. Organizer app creates new kind 31415 event
        │    with same d-tag but updated content + newer created_at
        │
        ▼
  Nostr Relays
        │
        │ 3. Relay replaces old event (same kind + pubkey + d-tag)
        │ 4. Relay forwards EVENT to all subscribers
        │
        ▼
  BJJ Scoreboard App (spectator)
        │
        │ 5. useMatches hook receives EVENT via async iterator
        │ 6. parseEvent() extracts MatchEvent from content JSON
        │ 7. dedup() keeps newest event per match id
        │ 8. React re-renders MatchCard with new scores
        │
        ▼
  Updated display (< 1 second latency typically)
```

## Deduplication Logic

Since events arrive from multiple relays and may be re-delivered, deduplication is essential:

```typescript
function dedup(matches: MatchEvent[]): MatchEvent[] {
  const grouped = new Map<string, MatchEvent>();
  for (const m of matches) {
    const prev = grouped.get(m.id);
    // Keep the event with the newest created_at
    if (!prev || (m.created_at ?? 0) > (prev.created_at ?? 0)) {
      grouped.set(m.id, m);
    }
  }
  // Sort newest first
  return Array.from(grouped.values())
    .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
}
```

## Time Window

The subscription filter uses `since: now - 24h`, so only matches from the last 24 hours are fetched. This keeps the data set manageable for tournament-day usage.

## Debug Mode

The app includes 8 hardcoded debug matches (`src/lib/debugMatches.ts`) that can be published to relays using `publishDebugMatchesToRelays()`. These cover all states:

1. In-progress, Fighter 1 winning big
2. In-progress, Fighter 2 winning narrowly
3. In-progress, tied score
4. Waiting (not started)
5. Finished, Fighter 1 won decisively
6. Finished, tied score (advantages decide)
7. Canceled
8. In-progress, 0-0 just started
