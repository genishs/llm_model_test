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
| Start game | click on title screen | tap title screen |
| Retry after game over | click | tap |

- Player auto-fires continuously; no fire button needed.
- If a keyboard arrow is pressed, keyboard mode takes priority (mouse/touch disabled for that frame). Otherwise the dragon smoothly follows the cursor/finger.
- **Touch**: place a finger anywhere on the play area and slide it left/right — the dragon follows your finger horizontally. Tap to start or retry.

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
- **Bosses** spawn every ~900 m of distance (bigger HP bar, drops many coins).
- **Score / distance / coins** are shown in the top HUD. Score = `distance/5 + kills*3`. Scroll speed and enemy HP scale with distance tiers.

## Files

```
simple_llm_test_fn_dragonflight_v2/
├── index.html   # entry point (loads game.js)
├── game.js      # all game logic, rendering, input, state machine
└── README.md    # this file
```

All required files are inside this folder. Open `index.html` in any modern browser to play.
