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

The on-screen button layout and the game board auto-resize to fit the phone screen (portrait/landscape), and respect safe-area insets for notched phones. The HUD (SCORE / LV / NEXT) sits at the top; `RESTART` appears when it's game over.

## Files
- `index.html` — the entire game (HTML + CSS + JS, self-contained).
- `README.md` — this document.
