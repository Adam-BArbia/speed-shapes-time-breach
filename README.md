# Speed Shapes: Time Breach

Collaborative Angular project for a live event game system.

This app is designed for real-time operation under pressure with two synchronized views:
- Public display view for projector output
- Hidden operator control view for game administration

## 1. Project Goal

Build an offline-capable local web app for the game "Speed Shapes: Time Breach" that is:
- Fast for operators
- Clear on projector screens
- Safe to recover after refresh via local persistence
- Deterministic in core game logic

## 2. Routes and Roles

- `/display`:
	- public game screen
	- title, stability percent, timer, 8x8 grid, team columns
- `/control`:
	- operator panel
	- assign teams, pending/correct/wrong actions, timer controls, reset and admin actions

## 3. Tech Stack

- Angular (standalone architecture)
- TypeScript (strict settings)
- Signals for app state
- localStorage for persistence
- Vitest for unit and component tests

## 4. Current Implementation Snapshot

Implemented:
- App scaffold and route structure
- Shared game state service with persistence and hydration
- 8x8 grid rendering and interaction flow
- Arabic question rendering
- Timer service and sound service
- Connection engine and connection line visualization
- Build and automated tests passing in latest local runs

In progress / pending:
- Complete undo/redo coverage for all mutating actions
- End-game display mode behavior
- Export features (JSON and PNG)
- Final release rehearsal and full manual verification

## 5. Quick Start

From project root:

```bash
npm install
npm run start
```

Then open:
- `http://localhost:4200/display`
- `http://localhost:4200/control`

If `ng` is not available on your PATH, keep using npm scripts instead of global Angular CLI commands.

## 6. Build and Test

```bash
npm run build
npm test -- --watch=false
```

Recommended pre-merge sequence:
1. Build must pass
2. Tests must pass
3. Relevant manual checks from `agentic/test.md` must be updated

## 7. Key Files and Where to Continue

Core references:
- `agentic/master_prompt.md` (product rules and behavior contract)
- `agentic/plan.md` (phase-based implementation strategy)
- `agentic/.todo` (milestone tracking)
- `agentic/test.md` (manual and automated verification checklist)
- `agentic/session_handoff.md` (state summary for next LLM/dev handoff)

Main code areas:
- `src/app/state/game-state.service.ts`
- `src/app/components/grid/`
- `src/app/pages/display-screen/`
- `src/app/pages/control-panel/`
- `src/app/services/timer.service.ts`
- `src/app/services/sound.service.ts`

## 8. Collaboration Conventions

- Keep game-rule changes aligned with `agentic/master_prompt.md`
- Prefer small, focused commits grouped by feature/fix
- Update `agentic/.todo` and `agentic/test.md` with real status after each meaningful change
- Do not mark checklist items complete unless verified
- Preserve offline-first behavior and local persistence integrity

## 9. Troubleshooting

Common local reset flow:
1. Use in-app reset actions first
2. If needed, clear browser localStorage for this app origin
3. Reload both routes and verify fresh baseline

If editor shows stale TypeScript diagnostics while build/tests pass:
- restart TypeScript server in VS Code
- reload the window

## 10. Notes for Our Collaboration

When we work together, we should treat these as source-of-truth priorities:
1. Functional correctness of game rules
2. Operator speed and reliability
3. Display readability and live-event safety
4. Testability and reproducibility

If you want, I can also add a short architecture diagram section in this README next.
