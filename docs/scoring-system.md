# BJJ Scoring System

## Overview

The application implements the standard **IBJJF (International Brazilian Jiu-Jitsu Federation)** point system. Scores are not calculated locally — they come from the Nostr event published by the tournament organizer. The app only **displays** scores.

## Point System

| Action | Points | Field (Fighter 1) | Field (Fighter 2) |
|--------|--------|--------------------|--------------------|
| Takedown | 2 | `f1_pt2` | `f2_pt2` |
| Sweep | 2 | `f1_pt2` | `f2_pt2` |
| Knee on Belly | 2 | `f1_pt2` | `f2_pt2` |
| Guard Pass | 3 | `f1_pt3` | `f2_pt3` |
| Mount | 4 | `f1_pt4` | `f2_pt4` |
| Back Control | 4 | `f1_pt4` | `f2_pt4` |

### Total Score Calculation

The total score is calculated in the `MatchCard` component:

```typescript
const f1Score = match.f1_pt2 * 2 + match.f1_pt3 * 3 + match.f1_pt4 * 4;
const f2Score = match.f2_pt2 * 2 + match.f2_pt3 * 3 + match.f2_pt4 * 4;
```

**Note:** The fields `f1_pt2`, `f1_pt3`, `f1_pt4` store the **count** of moves worth that many points, not the point total. The multiplication happens at display time.

### Example

If Fighter 1 has:
- `f1_pt2 = 2` (two 2-point moves: a takedown and a sweep)
- `f1_pt3 = 1` (one 3-point move: a guard pass)
- `f1_pt4 = 0` (no 4-point moves)

Total: `2*2 + 1*3 + 0*4 = 7 points`

## Advantages

Advantages (`f1_adv`, `f2_adv`) are secondary scoring units in BJJ. They are used as tiebreakers when the point scores are equal.

- Awarded for near-scoring attempts
- Displayed in a gold (`#F5B800`) strip below the main score

## Penalties

Penalties (`f1_pen`, `f2_pen`) are demerits for rule violations.

- Displayed in a red (`#C0392B`) strip below the main score
- In IBJJF rules, accumulated penalties can result in advantage points for the opponent

## Match States

| Status | Description | Visual Indicator |
|--------|-------------|------------------|
| `waiting` | Match created but not started | Gray badge, duration shown as countdown format |
| `in-progress` | Match is live | Green badge with pulsing dot, live countdown timer |
| `finished` | Match has ended | Outlined badge with trophy icon |
| `canceled` | Match was canceled | Outlined badge, dimmed text |

## Timer Logic

The timer is computed **client-side** based on the `start_at` timestamp and `duration`:

```typescript
// In useElapsed hook (inside MatchCard.tsx):
const elapsed = now - match.start_at;     // seconds since match started
const remaining = match.duration - elapsed; // seconds left

// Timer updates every 1 second via setInterval (only for in-progress matches)
```

### Timer Display Rules

1. **In-progress matches**: Shows countdown (`remaining`) in `M:SS` format
2. **Waiting matches**: Shows total duration as `M:SS` (e.g., `5:00` for 300s)
3. **Finished/canceled**: Shows `--:--`
4. **Last 30 seconds**: Timer turns gold (`#F5B800`) and pulses

### Timer Warning

When `remaining <= 30`, the timer text changes to amber/gold color with a CSS pulse animation:

```tsx
className={timer.remaining <= 30 ? 'text-[#F5B800] animate-pulse-live' : 'text-white'}
```

## Winner Determination

The app visually highlights the leading fighter:

1. Compare `f1Score` vs `f2Score`
2. The winning fighter's score panel gets a subtle pulse animation (`animate-pulse-live`)
3. A bouncing trophy icon (🏆) appears in the winning fighter's corner
4. If scores are tied, no winner indicator is shown

**Note:** The app does not determine the official winner — that's the organizer's responsibility via the match `status`.
