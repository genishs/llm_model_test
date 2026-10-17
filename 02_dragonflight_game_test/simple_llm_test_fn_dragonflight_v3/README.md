# Dragon Flight

세로 스크롤 슈팅 게임( inspired by the mobile game "드래곤플라이트" )이 HTML + Canvas 제작. 원작의 artwork·sound·name 에셋을 not copied — all graphics are hand-drawn with code.

## 실행 (no install / build / server)

이 폴더에 `index.html` 파일 double-click로 open a web browser를 directly run. No npm, no build step, no local server needed.

```
open index.html   # e.g. double-click in file manager, or drag into browser
```

## Controls

| Action | Keyboard | Mouse | Touch (mobile) |
| --- | --- | --- | --- |
| Move left/right | `←` / `→` (or `Left`/`Right`) | move cursor horizontally | drag finger left/right on screen |
| Insert credit coin | `C` or `I` (Insert Coin) | click anywhere on title / continue | tap on title / continue |
| Start game | insert credits, then it auto-starts once you have enough | same | same |
| Continue after game over | insert a credit within the countdown | click | tap |

- Player auto-fires continuously; no fire button needed.
- If a keyboard arrow is pressed, keyboard mode takes priority (mouse/touch disabled for that frame). Otherwise the dragon smoothly follows the cursor/finger.
- **Touch**: place a finger anywhere on the play area and slide it left/right — the dragon follows your finger horizontally. Tap to insert a credit / start / continue.

## Arcade flow: stages, credits, continue

The game is organized like an arcade cabinet: **title (idle) → start → play → game over → continue → title**, with no dead ends.

### Stages
- The run is split into **stages**. Each stage ends when you defeat that stage's **boss**; killing the boss advances to the next stage (`STAGE n` banner flashes).
- Difficulty scales with the stage number: later stages have more/tougher enemies, faster scrolling, and beefier bosses (more HP).
- The current **STAGE** is always shown in the top-center HUD.

### Credits (arcade coin slot) — separate from in-game coins
- **CREDIT coins** are the arcade currency used to *start* and to *continue*. They are inserted via a coin slot, not collected in the game:
  - Keyboard: press `C` or `I` to insert a credit.
  - Mouse / touch: click/tap on the title or continue screen to insert a credit.
- The **remaining CREDIT** count is shown in **cyan** (title bottom, HUD, and continue screen).
- To **start**, you must have banked enough credits (needs `CREDIT ≥ 2`): starting consumes one credit and leaves at least one so you can still continue if you die. With no/insufficient credits the title stays idle ("Insert Coin to Start").
- Do not confuse the two coin types:
  - **CREDIT** (cyan) = arcade currency for starting/continuing — inserted via keyboard/tap, never dropped by enemies.
  - **COIN** (gold) = in-game pickups that add to your score/combo counter — collected during play.

### Continue
- On game over a **CONTINUE?** screen appears with a countdown (~12 s).
- Insert a credit (`C`/tap) within the countdown to resume: your **score, stage, distance and coins are kept**, and one credit is consumed.
- If you do not insert a credit before the countdown ends, it returns to the title screen.

## Mobile / responsive

The canvas keeps a fixed internal resolution (480×800) but is CSS-scaled to fit any viewport, so it displays cleanly on phones without distortion. `touch-action:none` and `user-scalable=no` prevent accidental browser zoom/scroll gestures.

## Gameplay rules

- **Player** stays at the bottom and only moves left/right. Attack auto-fires upward.
- **Enemies** descend in horizontal wave rows. Each has HP; bullets chip it down, 0 → destroyed. If an enemy touches the player → Game Over.
- **Drops**: defeated enemies drop coins (score), and occasionally power-ups:
  - `P` (cyan hex) — Power Up: adds a bullet stream / more damage.
  - `MAGNET` (purple horseshoe) — pulls all nearby pickups to the player for ~8 s.
  - `S` (green shield) — grants an invulnerable shield ring + brief i-frames.
- **Meteors**: before a meteor falls, a red warning column with a dashed line and `!` triangle appears first; the meteor then streaks down that lane. Bullets can also shoot meteors to clear them early.
- **Bosses** spawn at the end of each stage; defeating the boss advances to the next (harder) stage.
- **Score / distance / coins** are shown in the top HUD. Score = `distance/5 + kills*3`. Scroll speed and enemy HP scale with distance tiers.

## Files

```
simple_llm_test_fn_dragonflight_v3/
├── index.html   # entry point (loads game.js)
├── game.js      # all game logic, rendering, input, state machine
└── README.md    # this file
```

All required files are inside this folder. Open `index.html` in any modern browser to play.
