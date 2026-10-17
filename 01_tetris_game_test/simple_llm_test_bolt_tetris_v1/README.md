# Tetris (Atari 1988 Style)

HTML5 Canvas 기반 테트리스 게임입니다. 별도 설치나 빌드 없이 `index.html`을 브라우저에서 열면 바로 실행됩니다.

## 실행 방법

1. 폴더 내 `index.html`을 웹 브라우저(Chrome, Edge, Firefox, Safari 등)로 엽니다.
2. 게임이 자동으로 시작됩니다.

## 조작법

| 키 | 동작 |
|---|---|
| ← → | 블록 이동 |
| ↑ | 블록 회전 |
| ↓ | 소프트 드롭 (가속 낙하) |
| Space | 하드 드롭 (즉시 낙하 및 고정) |
| P | 일시정지 / 재개 |
| R | 게임 재시작 |

## 파일 구성

```
simple_llm_test_bolt_tetris_v1/
├── index.html   # 게임 본체 (HTML/CSS/JS 포함)
└── README.md    # 이 문서
```

## 게임 특징

- Atari Games 1988년 아케이드판 테트리스의 게임성 및 그래픽을 재현
- 7종 테트로미노 (I, O, S, Z, J, L, T) 지원
- 라인 클리어, 레벨 상승, 난이도 가속
- NEXT 미리보기, SCORE / LINES / LEVEL 표시
- 반응형 레이아웃 (모바일에서도 조작 가능)