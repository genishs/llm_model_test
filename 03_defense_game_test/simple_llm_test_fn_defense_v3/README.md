# Crystal Defense

디펜스 게임, 웹 브라우저에서 바로 실행되는(별도 설치·빌드·서버 없이) 디펜스 게임을.

## 기획 / 세계관 (Worldview)
- **장르**: Lane-based Tower Defense.
- **세계관**: 한 신비유 crystal(자포니의 base)에 에너 route의 monstro(Enemies) attack을해. player tower를 place이는 gold로 buy하고, enemies path沿着 walk로 base까지 reach기하면 lives loss으로 lose과.
- **goal**: survive로 infinite waves로 maximize wave score으로 win condition.

## Rules (Rules)
- Enemies spawn per wave, follow fixed winding path toward the crystal base.
- Placing towers costs gold; killing enemies rewards gold.
- If too many enemies reach the base (lives=0), game over.
- Waves grow harder: more grunts, then runners & tanks appear.

## Tower types
| Key | Tower | Cost | Range | Rate | Effect |
|-----|-------|------|-------|------|--------|
| 1 | Archer | 50 | 140 | fast | single-target damage |
| 2 | Cannon | 90 | 110 | slow | splash AoE damage |
| 3 | Frost  | 70 | 120 | mid | slows enemies + light dmg |

## Enemy types
- **grunt** (red) — balanced.
- **runner** (yellow) — fast, low HP.
- **tank** (purple) — slow, high HP.

## 실행 방법 (How to run)
1. `index.html`에서 double-click로 open이는 web browser으로 launch기하면 game를 start。
2. No build / no server required. All files stay in this folder.

## 조작법 (Controls)
- **Mouse move**: hover a grid cell to preview tower placement (green=OK, red=no).
- **Left click**: place the currently selected tower on a valid empty cell (not on path).
- **Keys 1 / 2 / 3**: select Archer / Cannon / Frost.
- **P**: toggle pause.

## 📱 Touch controls (mobile)
The game auto-fills the phone screen (viewport meta + canvas scales to device width/height).
- **Tap an empty cell**: place the currently selected tower there (same rules as click; green=OK, red=no).
- **Bottom-left selector buttons** (Archer 50 / Cannon 90 / Frost 70): tap one to switch the selected tower type before placing.
- **Bottom-right "Pause" button**: tap to toggle pause.
- Single-finger taps only; drag is ignored so accidental moves won't misplace towers.
- Desktop keyboard/mouse controls above remain fully supported unchanged.

## 파일 구성 (File structure)
```
simple_llm_test_fn_defense_v2/
├── index.html   # entry point, opens in browser
├── game.js      # all game logic + rendering (Canvas 2D)
└── README.md    # this file
```

## Credits / License
- No external libraries, images, or sounds are used. All graphics are drawn procedurally with Canvas 2D and the Web Audio API is not used.
- Original code written for this project; free to reuse.
