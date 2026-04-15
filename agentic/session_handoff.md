# Session Handoff for Next LLM

## 1) Product Intent (from master_prompt)

Build a production-ready offline Angular app for the live game "Speed Shapes: Time Breach" with two routes:
- `/display`: projector-safe public screen (title, stability, timer, 8x8 grid, teams)
- `/control`: operator-only control panel (grid actions, timer controls, edits, undo/redo)

Core guarantees:
- Fast operator workflow under pressure
- Local persistence via localStorage
- No backend
- Connection rule: exactly 3 consecutive confirmed cells, single connection per shape

## 2) Implemented System Status (from plan + todo + current code)

Done and stable:
- Angular standalone app scaffolded with routing for `/display` and `/control`.
- Shared game state service using Angular signals and localStorage hydration/persistence.
- Team defaults, 8x8 grid initialization, stability computation.
- Arabic question text rendering and question-cell binding.
- Main control actions: assign team, mark correct, mark wrong.
- Timer service: start/pause/resume/reset, timestamp-based anti-drift behavior.
- Sound service: correct/wrong/connection/ticking/time-up, with mute/volume controls.
- Board reset/flush capability.
- Connection engine logic:
  - checks H/V/diag-right/diag-left
  - enforces exactly-3 groups including the newly confirmed cell
  - prevents reused cells in additional connections
  - prioritizes longest-chain direction, random tie-break on equal priority
- Connection visual overlay in grid (line rendering over cells).
- Build and tests passing in recent runs.
- End-game display mode: grid-only layout with TIME'S UP banner when timer ends.

Partially done / still risky:
- Undo/redo exists in UI/services but not all state mutations are fully command-registered.
- Export features (PNG/JSON) are not implemented.
- Some milestone checkboxes in `.todo` are optimistic compared to strict manual event testing.
- Cross-tab sync via storage event listener: "/display" auto-updates when "/control" writes state.

## 3) Current Behavior Expectations

Game loop at operator level:
1. Select cell
2. Assign team (question becomes pending for team)
3. Mark answer correct or wrong
4. Correct -> confirmed shape
5. Wrong -> clear/release behavior
6. New confirmations may trigger one connection if rules match

Display should remain projector-friendly and fit without scroll under typical laptop/projector resolutions.

## 4) Known Gaps to Prioritize Next

Priority A (functional correctness):
- Finish full undo/redo command coverage for every mutating action.
- Re-validate question lifecycle logic against game rules (especially rejected/available and permanent resolution policy).
- Run full manual connection regression matrix in all directions and edge cases.

Priority B (release readiness):
- Implement end-game mode UI switch and verify operator behavior after time-up.
- Implement export JSON and PNG.
- Complete testing checklist with verified evidence, not assumptions.

Priority C (quality):
- Accessibility and keyboard focus polish.
- Performance checks for animation + rapid operator input.

Priority D (repo hygiene):
- Remove accidental gitlink entry `speed-shapes-time-breach` (mode 160000) unless a real submodule is intended.
- Ensure no nested repo artifacts are tracked without `.gitmodules` mapping.

## 5) Source of Truth Files for Continuation

Read these first in this order:
1. `agentic/master_prompt.md` (product requirements and game rules)
2. `agentic/plan.md` (phase architecture and technical intent)
3. `agentic/.todo` (milestone tracking; treat as draft progress)
4. `agentic/test.md` (manual/automated validation checklist)

Then inspect code starting from:
- `src/app/state/game-state.service.ts`
- `src/app/components/grid/*`
- `src/app/pages/display-screen/*`
- `src/app/pages/control-panel/*`
- `src/app/services/timer.service.ts`
- `src/app/services/sound.service.ts`

## 6) Practical Next Session Plan

1. Run `npm run build` and `npm test -- --watch=false` to establish baseline.
2. Remove accidental gitlink entry `speed-shapes-time-breach` if submodule usage is not intentional.
3. Execute manual gameplay checklist from `agentic/test.md` and annotate only observed outcomes.
4. Close highest-risk functional gaps first: undo/redo completeness, question lifecycle consistency.
5. Implement export and final rehearsal pass with projector-oriented layout verification.
