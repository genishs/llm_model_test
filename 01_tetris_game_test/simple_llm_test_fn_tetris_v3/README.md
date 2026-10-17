# Tetris (index.html)

Single-file HTML5 Tetris. No build, no server, no dependencies — open `index.html` in any browser and it runs immediately. Works on desktop (keyboard) and mobile phones (touch).

## Run

Just double-click / open `index.html` in a browser (or drag the file into the browser). Nothing else is required.

## Controls

### Desktop (keyboard)
| Key | Action |
| --- | --- |
| ← / → | Move left / right |
| ↓ | Soft drop |
| Enter | Hard drop |
| Space or R | Rotate clockwise |

### Mobile (touch) — two ways, use whichever you prefer

**1. On-screen buttons** (auto-shown only on touch devices, in the bottom corners):

| Button | Action |
| --- | --- |
| ◀ / ▶ | Move left / right |
| ▼ | Soft drop |
| ⟳ (top-right of right cluster) | Rotate clockwise |
| ↺ (bottom-right corner) | Rotate counter-clockwise |
| DROP | Hard drop |

**2. Direct gestures on the board:**

| Gesture | Action |
| --- | --- |
| Tap (quick touch, no move) | Rotate clockwise |
| Swipe ← / → | Move one column in that direction |
| Swipe ↓ (repeatedly) | Soft drop |
| Fast long swipe ↓ | Hard drop |

The on-screen button layout and the game board auto-resize to fit the phone screen (portrait/landscape), and respect safe-area insets for notched phones. The HUD (SCORE / LV / NEXT / CREDIT) sits at the top; arcade screens (`INSERT COIN`, `CONTINUE?`) appear when needed.

## Arcade: Levels, Credits & Continue

The game now runs like an arcade cabinet with a seamless flow:

`TITLE (idle) → INSERT COIN → PLAY → GAME OVER → CONTINUE → TITLE`

### Level rules
- The playfield starts at **LV 1**. Every **10 lines cleared** raises the level by 1 (`level = floor(totalLines / 10) + 1`).
- Higher levels fall faster: gravity interval is `max(90ms, 800 - (level-1)*70)`, so pieces drop quicker as LV rises.
- The current level is always shown on screen as **`LV n`** in the HUD.

### Credits (coins) — required to start
- You begin with **3 credits**. The remaining count is shown as dots (`●●●`) in the HUD and on the title screen.
- **You cannot play without a credit.** On the TITLE screen you must insert a coin to start; starting a game consumes one credit.
- Insert a coin:
  - Keyboard: press **`C`** (or `INSERT`).
  - Touch: tap the **`🪙 INSERT COIN`** button at the bottom center.

### Continue (after GAME OVER)
- When the stack tops out, a **CONTINUE countdown** appears (`CONTINUE? 15 … 0`) for **15 seconds**.
- Spend one credit to continue — **score, level and the board are kept**, only a fresh piece spawns:
  - Keyboard: press **`C`** within the countdown.
  - Touch: tap the **`↻ CONTINUE?`** button.
- If no coin is inserted before the countdown reaches 0 (or you have no credits left), it returns to the TITLE screen.

## Files
- `index.html` — the entire game (HTML + CSS + JS, self-contained).
- `README.md` — this document.
