# Speed Shapes: Time Breach — Implementation Plan

## 1. Scope and Success Criteria

- Build an Angular 17 standalone app with two routes:
  - `/display` for the public projector screen
  - `/control` for the hidden operator panel
- Run fully offline on localhost with no backend.
- Persist all game-critical data in localStorage.
- Ensure operator actions are immediate and resilient under live event pressure.

## 2. Architecture Blueprint

### App Structure

- App shell with router-only layout.
- Route-level pages:
  - DisplayScreenComponent
  - ControlPanelComponent
- Reusable UI units:
  - GridComponent
  - CellComponent
  - TeamPanelComponent
  - TimerComponent

### Core Services

- GameStateService
  - Owns teams, grid, question usage, connections, and derived stats.
  - Exposes state via signals and computed values.
  - Handles auto-save and restore.
- TimerService
  - Countdown engine with start/pause/resume and threshold events.
- UndoService
  - Action history stack with undo/redo (target: 20 actions).
- SoundService
  - Preloads and plays SFX with overlap guards.

## 3. Data Model (Initial)

- Team
  - `id`, `name`, `color`, `shape`
- Cell
  - `index` (1..64), `state` (`empty|pending|confirmed|used`), `teamId?`, `questionId?`, `connectionId?`
- Connection
  - `id`, `cellIndices[3]`, `teamId`, `direction`, `createdAt`
- Timer State
  - `durationSec`, `remainingSec`, `status` (`idle|running|paused|ended`), `lastTickAt?`
- Question Bank
  - Map of questionId (cell index string) to Arabic text
- Question Locks
  - `available`, `assignedPending`, `resolved`

## 4. Delivery Phases

### Phase 0 — Scaffold and Baseline

- Generate Angular app structure and standalone routing.
- Add routes `/display` and `/control`.
- Establish global theme tokens (sci-fi dark, neon accents).
- Add strict TypeScript settings and lint/format scripts.

### Phase 1 — Core State and Persistence

- Implement GameStateService + storage adapter.
- Implement team config defaults (6 teams) with localStorage persistence.
- Implement grid state initialization and hydration.
- Add computed stability percentage.

### Phase 2 — Grid and Question Flow

- Build 8x8 grid render with high-performance trackBy.
- Control interactions:
  - assign team
  - create pending lock
  - confirm answer
  - reject answer
  - manual edits and reassign
- Team panel: one active pending question per team.
- Render question text in Arabic, with RTL-safe presentation where questions appear.

### Phase 3 — Connections Engine

- Detect exactly-3 sequences on confirm:
  - horizontal, vertical, diagonal down-right, diagonal down-left
- Enforce one-connection-per-shape.
- Handle long chains by selecting one valid trio only.
- Tie-break rule:
  - longest contiguous chain direction first
  - random among equal candidates
- Add connection visuals (line + glow + used fade).

### Phase 4 — Timer and End Game

- Add 30-minute default countdown.
- Implement start/pause/resume controls.
- Trigger 30-second ticking sound.
- Trigger end buzzer at 0.
- Enter end-game display mode (grid-focused, no timer/team columns).

### Phase 5 — Undo/Redo + Operator Efficiency

- Add action command model across mutable operations.
- Store and replay up to ~20 actions.
- Keyboard shortcuts:
  - Ctrl+Z undo
  - Ctrl+Y redo
- Ensure deterministic state replay with persistence sync.

### Phase 6 — Export + Final Polish

- Export PNG (title + stability + grid snapshot).
- Export JSON full game state.
- Final projector-quality display polish and responsive control layout.
- Accessibility and keyboard speed checks for operators.

## 5. UI/UX Direction

- Visual style: dark sci-fi, neon blue/purple accents, subtle animated gradients.
- Display priorities:
  - large title and stability
  - dominant center grid
  - clear timer at top-right
  - readable team columns with current question
- Control priorities:
  - no blocking popups for routine actions
  - inline rapid actions in/near selected cell
  - explicit manual override actions for any state

## 6. Performance Strategy

- Signal-based local state slices to minimize rerenders.
- `trackBy` everywhere in repeated templates.
- Precompute directional index helpers for connection checks.
- Avoid deep clone on every action; use structured action patches.
- Throttle persistence writes where needed while preserving reliability.

## 7. Test Strategy (Practical)

- Unit tests:
  - connection detection edge cases
  - one-connection-per-shape enforcement
  - timer transitions and threshold events
  - undo/redo integrity
- Component tests:
  - control flow for pending/confirm/reject
  - display panel rendering from state
- Manual runbook:
  - stress test with rapid operator actions
  - reload recovery from localStorage
  - end-game mode transition correctness

## 8. Risks and Mitigations

- Ambiguous connection candidates:
  - Mitigation: deterministic candidate scoring + controlled random tie-break seed.
- localStorage corruption or stale schema:
  - Mitigation: versioned schema + migration/fallback reset.
- Timer drift:
  - Mitigation: derive remaining time from timestamps, not just interval counters.
- Operator misclicks:
  - Mitigation: undo/redo + explicit override tools.

## 9. Immediate Next Steps

1. Scaffold Angular project with standalone routing and two pages.
2. Implement base domain types and GameStateService skeleton.
3. Render 8x8 grid on both routes from shared state.
4. Wire localStorage persistence and hydration.
5. Build first-pass control interactions for pending/correct/wrong cycle.
