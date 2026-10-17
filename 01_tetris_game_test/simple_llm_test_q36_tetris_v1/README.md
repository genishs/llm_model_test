# TETRIS - Atari 1988 Arcade Edition

A faithful recreation of the classic Atari Games 1988 arcade Tetris game, built entirely as a single HTML file with no dependencies, no build tools, and no server required.

## How to Play

Simply open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge). No installation, no server, no setup required.

## Controls

| Key | Action |
|-----|--------|
| **← →** | Move piece left/right |
| **↑** | Rotate piece clockwise |
| **↓** (hold) | Soft drop (faster fall) |
| **Space** | Hard drop (instant drop) |
| **C** or **Shift** | Hold piece (swap current with held) |
| **P** | Pause / Resume game |
| **R** | Restart game |
| **Enter** | Start game / Restart after game over |

## Features

- **Authentic 10x20 play field** matching the original arcade dimensions
- **All 7 classic tetrominoes** (I, O, T, S, Z, J, L) with proper colors
- **SRS rotation system** with wall kicks for precise piece positioning
- **Ghost piece** showing where your piece will land
- **Hold piece** functionality to save pieces for later
- **Next piece preview** showing the next 3 incoming pieces
- **7-bag randomizer** for fair piece distribution
- **Line clear animation** with white flash effect
- **Scoring system**: Singles, Doubles, Triples, and Tetris (scaled by level)
- **Soft drop** and **hard drop** with point bonuses
- **Lock delay** giving time for last-second adjustments
- **DAS (Delayed Auto Shift)** for smooth repeated movement
- **Increasing difficulty** with 40 speed levels
- **Pause** functionality
- **Game over detection** with restart option

## Visual Style

- Dark arcade aesthetic with black background
- Classic tetromino colors: I=Cyan, O=Yellow, T=Purple, S=Green, Z=Red, J=Blue, L=Orange
- 3D beveled block rendering with highlight and shadow edges
- Subtle grid lines on the play field
- Retro pixel-style monospace typography
- Animated start screen with blinking prompt
- Game over screen with score summary

## File Structure

```
simple_llm_test_q36_tetris_v1/
├── index.html    # Complete game (HTML + CSS + JavaScript)
└── README.md     # This file
```

The entire game is contained in `index.html` — all CSS styling and JavaScript game logic are embedded inline.

## Technical Details

- **Rendering**: HTML5 Canvas API
- **Architecture**: Single-file, self-contained HTML document
- **Randomizer**: 7-bag system (standard for modern Tetris)
- **Rotation**: Simplified SRS (Super Rotation System) with wall kicks
- **Controls**: Keyboard input with DAS (Delayed Auto Shift) support
- **Performance**: 60fps game loop using `requestAnimationFrame`

## Browser Compatibility

Works in all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Score Table

| Lines | Base Score | Multiplied by Level |
|-------|-----------|---------------------|
| 1 (Single) | 30 | × level |
| 2 (Double) | 50 | × level |
| 3 (Triple) | 100 | × level |
| 4 (Tetris) | 300 | × level |

Additional points:
- **Soft drop**: 1 point per row
- **Hard drop**: 2 points per row dropped
