# Speed Shapes: Time Breach - Test Checklist

## Legend

- `[+]` Passed and verified.
- `[-]` Failed and needs fixing.
- `[~]` Partial/inconsistent; re-test required.
- `[ ]` Not tested yet.

Use this checklist before live use. Mark each item after verification.

## 0) Automated Testing Commands and Procedure

Run these in `PowerShell` from project root (`C:\dev\cmp_clt_01_05_game_3`).

1. Install dependencies (first run or after package changes):

```powershell
npm install
```

2. Run static production build check:

```powershell
npm run build
```

Pass criteria:
- Command exits with code `0`
- Output contains `Application bundle generation complete`

3. Run all automated unit/component tests one-shot:

```powershell
npm test -- --watch=false
```

Pass criteria:
- Command exits with code `0`
- Output shows all test files passing (example: `Test Files 3 passed`)

4. Optional: run tests continuously while developing:

```powershell
npm test
```

5. Optional: quick local serve validation before manual test rounds:

```powershell
ng serve
```

Then open:
- `http://localhost:4200/display`
- `http://localhost:4200/control`

Recommended order each cycle:

1. `npm run build`
2. `npm test -- --watch=false`
3. Manual functional checks from this checklist

If any command fails:

1. Fix compile/test error
2. Re-run `npm run build`
3. Re-run `npm test -- --watch=false`
4. Continue only when both pass

## 1) Preflight

- [+] Node/npm installed and project dependencies installed (`npm install`)
- [+] App builds without errors (`npm run build`)
- [+] Unit tests pass (`npm test -- --watch=false`)
- [+] App starts locally (`ng serve`) and opens at `/display` and `/control`

## 2) Unit Tests (Automated)

- [+] `GameStateService` default state test passes (64 cells, 6 teams, stability starts at 0)
- [+] `GameStateService` localStorage persistence test passes
- [+] Board reset test passes (cells/connections/pending cleared, timer/teams retained)
- [+] Connection creation test passes (3 cells become `used`, connection metadata created)
- [+] Long-chain test passes (only one connection created and includes newly confirmed cell)
- [+] `Grid` component tests pass (overlay renders, line count, coordinates, color mapping, new-line animation class)
[connection overlay now renders above cells and is visible on screen]
## 3) Functional - Grid and Question Flow

- [+] Select a cell in `/control` and set pending for a team
- [+] Pending cell appears with pending style on both `/control` and `/display`
- [+] Team panel shows active Arabic question for that team (RTL rendering)
- [+] Mark correct changes cell to confirmed/used flow and removes team pending question
- [+] Mark wrong clears the pending cell and removes team pending question
- [+] Reassigning pending for same team keeps only one active pending question
- [+] Clearing selected cell works for non-pending and pending cells
- [+] Reset Board clears all occupied/pending cells and connections

## 4) Functional - Connection Engine

- [+] Horizontal exactly-3 is detected after confirming third shape
- [+] Vertical exactly-3 is detected after confirming third shape
- [+] Diagonal down-right exactly-3 is detected
- [+] Diagonal down-left exactly-3 is detected
- [+] Connection chooses only one trio in long chains (does not create multiple at once)
- [+] Cells in a connection are marked `used`
- [+] Connected cells are not reused in another connection
- [+] Connection metadata exists with team, direction, and timestamp
[connection engine now computes and persists correctly]

## 5) Functional - Connection Visuals

- [+] Connection lines render over grid after connection creation
- [+] New connection has draw animation and glow pulse
- [+] Line color matches connection team color
- [+] Visual fades to non-new state after animation window
- [+] No click interaction blocked by overlay
[connection overlay now sits above cells with pointer-events disabled]

## 6) Functional - Timer

- [+] Start begins countdown from 30:00
- [+] Pause freezes timer
- [+] Resume continues from paused value
- [+] Reset returns to idle and full duration
- [+] Timer shown correctly on `/display`
- [+] Timer status text updates correctly
- [+] Countdown remains stable over time (no visible drift spikes)
- [+] Timer state survives reload (persisted)
[no auto reload (frame by frame rediring) but everything holds under manual reloads (ctrl+r)]

## 7) Functional - Sound

- [+] Correct answer sound plays on Mark Correct
- [+] Wrong answer sound plays on Mark Wrong
- [+] Connection sound plays only when new connection is created
- [+] Ticking starts automatically at <= 30 seconds while running
- [+] Ticking stops when leaving threshold or timer is not running
- [+] Time-up buzzer plays once when timer reaches 0
- [+] Mute toggle disables audible output
- [+] Volume slider changes loudness
- [+] No rapid duplicate/overlap artifacts on repeated actions [cooldown logic prevents repeated spam]

## 8) Functional - Undo/Redo

- [+] Undo button works
- [+] Redo button works
- [+] Ctrl+Z triggers undo
- [+] Ctrl+Y triggers redo
- [+] Buttons correctly disable when no history is available
[undo / redo controls are present; verify behavior in a manual pass]

## 9) Display Layout and UX

- [+] `/display` fits in one screen without scrolling
- [~] Left info panel (title/timer) is readable and not cramped [can still be bigger]
- [+] Grid remains centered and occupies most available center area
- [~] Team cards occupy right side and are readable[can still be bigger]
- [+] Stability percentage updates live after state changes
- [~] /display updates live in a separate tab when /control makes changes (cross-tab-sync)[ doesn't work for the timer which is still on manual reload]
- [+] End-game banner appears with TIME'S UP and final stability when timer hits 0
- [+] Info panel and teams panel are hidden in end-game mode
- [+] Grid expands to fill full width in end-game mode

## 10) Persistence and Recovery

- [+] Reload browser and verify board state restored
- [+] Reload browser and verify connections restored
- [+] Reload browser and verify timer restored
- [+] Reload browser and verify team config restored
- [ ] Corrupted localStorage falls back safely to valid default state [needs a deliberate invalid localStorage test]

## 11) Integration Scenarios (End-to-End)

- [+] Scenario A: Pending -> Correct -> Connection formed -> Visual line + sound + used state
- [+] Scenario B: Pending -> Wrong -> Cell cleared -> Question panel cleared
- [ ] Scenario C: Rapid operator actions (20+ clicks/min) without UI lag or state corruption [manual stress test still recommended]
- [+] Scenario D: Timer hits 30 sec during gameplay and ticking starts correctly
- [+] Scenario E: Timer reaches 0 and buzzer plays while board remains editable

## 12) Performance and Reliability

- [ ] No dropped frames during connection animation on target machine
- [+] No major input lag on `/control`
- [ ] Memory remains stable during a full 30-minute session
- [ ] No console errors during normal operation

## 13) Live Event Dry Run (Final Gate)

- [ ] Full rehearsal from empty board to time up completed
- [ ] Operator can recover from mistakes using existing controls
- [ ] Arabic questions display correctly for all teams
- [ ] Projector readability validated from audience/referee distance
- [ ] Backup plan confirmed (Reset Board + persisted reload behavior)

## 14) Sign-off

- [+] Tech check completed
- [ ] Operator check completed
- [ ] Referee/viewing check completed
- [ ] Final go-live approval
