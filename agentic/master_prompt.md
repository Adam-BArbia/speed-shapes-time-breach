# 🚀 MASTER PROMPT — Speed Shapes: Time Breach (Angular 17)

---

## 🧠 ROLE & OBJECTIVE

You are a **senior Angular 17 engineer + UI/UX designer for live game systems**.

Your task is to build a **production-ready web application** for a live event game called:

> **Speed Shapes: Time Breach**

This system must be:
- Fast
- Reliable under pressure
- Operator-friendly
- Visually clean for a giant projector
- Fully offline (localhost)

---

## 🏗️ TECH STACK

- Angular 17 (standalone components)
- No backend (frontend-only)
- State managed via Angular services (RxJS or Signals)
- Local persistence via `localStorage`
- Routing:
  - `/display` → public screen
  - `/control` → control panel

---

## 🖥️ SYSTEM ARCHITECTURE

### 1. DISPLAY SCREEN (`/display`)
Fullscreen, no controls.

Shows:
- Game Title: Speed Shapes: Time Breach
- Stability Counter (%)
- Global Timer
- 8×8 Grid
- Side Panel (6 team columns)

---

### 2. CONTROL PANEL (`/control`)
Hidden operator interface.

Features:
- Full grid interaction
- Team assignment
- Question triggering
- State editing
- Undo/Redo
- Timer control
- Config panel

---

## 🎮 CORE GAME LOGIC

### GRID
- 8×8 (64 cells)
- Numbered 1 → 64 (left → right, top → bottom)

---

### CELL STATES

Each cell can be:

1. Empty
2. Pending
   - Grey / dotted shape
   - Question locked but not answered
3. Confirmed
   - Colored team shape
   - Permanently locked
4. Used in connection
   - Slightly faded but visible

---

### TEAM SYSTEM

- 6 teams
- Each has:
  - Name
  - Color
  - Shape (icon)

Stored in persistent localStorage

---

### QUESTION SYSTEM

Questions stored in a local JSON file:

```json
{
  "1": "Question text...",
  "2": "Question text..."
}
```

---

### QUESTION FLOW

1. Operator clicks a cell
2. Assigns a team
3. System:
   - Locks question ID = cell number
   - Displays question in team column
   - Places pending shape

4. Then operator chooses:
   - ✅ Correct:
     - Shape becomes confirmed
     - Question removed permanently
   - ❌ Wrong:
     - Shape removed
     - Question becomes available again

---

## 🔗 CONNECTION SYSTEM

### RULES

- A connection = exactly 3 consecutive shapes
- Directions:
  - Horizontal
  - Vertical
  - Diagonal ↘
  - Diagonal ↙

---

### CONSTRAINTS

- A shape can belong to ONLY ONE connection
- Chains longer than 3:
  - Example:
    - 5 in a row = 1 connection + 2 unused shapes

---

### DETECTION LOGIC

When a new shape is confirmed:

1. Check all 4 directions
2. Find valid groups of exactly 3 including the new shape
3. If multiple:
   - Prioritize direction with longest contiguous chain
   - If tie → pick randomly
4. Only ONE connection is created

---

### VISUAL FEEDBACK

- Draw animated line across the 3 shapes
- Apply glow effect
- Play connection sound
- Shapes become slightly faded

---

## ⏱️ TIMER SYSTEM

- Default: 30 minutes
- Controls:
  - Start
  - Pause
  - Resume

- At 30 seconds:
  - Play ticking sound

- At 0:
  - Play loud buzzer
  - System remains editable

---

## 📊 STABILITY COUNTER

- % = confirmed cells / 64
- Updates live

---

## 🖥️ DISPLAY UI DESIGN

### STYLE

- Sci-fi (Time Breach theme)
- Dark background
- Neon accents (blue/purple)
- Subtle animations
- Clean typography

---

### LAYOUT

Top:
- Title
- Stability %

Top-right:
- Timer

Center:
- Grid

Right:
- 6 team columns:
  - Team name
  - Current question
  - One active question per team

---

## 🎛️ CONTROL PANEL UX

### FAST INTERACTION

- Click cell → inline quick controls
- No slow popups

---

### ACTIONS

Operator can:
- Assign team
- Confirm / reject answer
- Edit any cell
- Reassign ownership
- Remove connections
- Full manual override

---

## 🔄 UNDO / REDO

- Store last ~20 actions
- Ctrl+Z → Undo
- Ctrl+Y → Redo

---

## 💾 PERSISTENCE

Save in localStorage:
- Team config
- Grid state
- Timer state
- Connections

Auto-save on every action

---

## 🔊 SOUND SYSTEM

Include:
- Correct answer sound
- Wrong answer sound
- Connection sound
- Last 30 sec ticking
- Time up buzzer

Style: clean, not overly dramatic

---

## 📤 EXPORT SYSTEM

### Export PNG:
- Grid
- Title
- Stability %

### Export JSON:
- Full game state

---

## 🎮 END GAME MODE

After timer ends:

- Switch to grid-only display
- No timer
- No team columns

Used for referee validation

---

## 🧩 COMPONENT STRUCTURE

Services:
- GameStateService
- TimerService
- UndoService
- SoundService

Components:
- GridComponent
- CellComponent
- DisplayScreenComponent
- ControlPanelComponent
- TeamPanelComponent
- TimerComponent

---

## 🚀 PERFORMANCE REQUIREMENTS

- No lag
- Instant updates
- No reloads
- Optimized rendering (trackBy, signals)

---

## 🎯 FINAL GOAL

The app must feel like:
- A live TV game control system
- Reliable under stress
- Easy for one operator
- Visually impressive on a giant screen
