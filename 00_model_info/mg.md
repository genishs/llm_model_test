# mg - Muse Glimmer 30B

[← 모델 목록](README.md)

## 기본 정보

| 항목 | 내용 |
|---|---|
| 풀네임 | Muse Glimmer 30B |
| 만든 곳 | Meta |
| 공개일 | 원본 2026-08-09 · GGUF 저장소 2026-08-09 |
| 라이선스 | Apache-2.0 |

## 원본 · GGUF 출처

- GGUF: https://huggingface.co/meta-models/Muse-Glimmer-30B-GGUF (DFlash 초안 모델 포함)

## 구조

dense. 전체 30B 가 모두 활성(활성 = 전체). 에이전트용. 토큰마다 가중치 전체를 읽으므로 MoE 보다 느리다(메모리 대역폭 한계).

## 양자화 · 파일

| 항목 | 내용 |
|---|---|
| 양자화 | KQuant-Dynamic Q4_K_XL |
| 파일 | `Muse-Glimmer-30B-KQuant-Dynamic-Q4_K_XL.gguf` · 19.7GB (19,653,960,832 B) |
| sha256(앞 16자) | `ac7023d6a4c704eb` |
| 초안 모델 | `dflash-Muse-Glimmer-30B-Q4_K_M.gguf` · 1.6GB (1,631,208,128 B) · `b2e808bf656086fe` |

## 서버 설정 (router preset)

공통값: `n-gpu-layers = 999`(전부 GPU) · `flash-attn = on` · `jinja = true` · `c = 65536`(문맥 64K) · `load-mode = none`(통째로 메모리에 올림). 모델 섹션이 같은 키를 쓰면 공통값을 덮어쓴다.

- 생각 모드: 서버가 아니라 요청마다 정한다. 요청의 `chat_template_kwargs.reasoning_strength` 로 강도를 주며, opencode variant `low`(기본)/`xhigh` 로 보낸다.
- 샘플링: 모델 기본값
- 투기적 디코딩: `model-draft` = DFlash 초안, `spec-type = draft-dflash`, `spec-draft-n-max = 6` (초안 길이 3≈6 > 10·16 - 길면 수락률이 떨어져 오히려 느려진다)
- 문맥: 64K(공통값)
- mmproj: 없음

## 표준 시험 실측

2026-10-17, llama.cpp b11701, Strix Halo 서버(GPU, 한 번에 한 모델). 방법은 [README](README.md#읽는-법) 참고.

| 항목 | 내용 |
|---|---|
| 첫 응답(모델 교체 포함) | 65.5초 |
| 생성 속도 | 25.7 t/s |
| 긴 프롬프트 읽기(약 1만 토큰) | 331 t/s |
| GTT | 22.7G |
| 초안 수락률 | DFlash 45% |
| 자동 채점 통과 횟수 | 2/2회 |

생각 강도 low 로 잰 값이다(생각 약 3.9천 자).

## 알려진 특성 · 주의점

- 과거 실측: 생성 20~30 t/s · 읽기 190~310 t/s · DFlash 수락 75%(벤치) / 27~44%(실전).
- dense 라 서브에이전트가 동시에 돌면 슬롯이 속도를 나눠 쓰며 크게 느려진다(과거 한 실전 과제에서 평균 7.2 t/s).
- 이전 실전 과제(웹 테트리스, xhigh)에서 18분14초가 걸렸다. 작업시간이 가장 길었지만 직접 플레이 판정에서 완성도가 가장 높았다(n=1).

## 참가한 테스트

- [01 테트리스 게임 테스트](../01_tetris_game_test/README.md#9-결과--v1) — v1: 8위 / 총점 571.5 — I·S 조각 없음, 하드드롭 예외, 다음 블록·게임오버 없음 (142줄 압축형) · [v2](../01_tetris_game_test/README.md#9-2-결과--v2): 4위 / 총점 736 — 버튼과 스와이프 동작·README 정확, START 가림과 하드드롭 크래시(v1 버그) 그대로 · [v3](../01_tetris_game_test/README.md#9-3-결과--v3): 6위 / 총점 630 — 자연 게임 오버가 일어나지 않아 컨티뉴에 도달 못 하고 하드드롭 예외로 루프가 멈춤
- 테트리스 종합: v1 571.5 → v2 736 → v3 630, 평균 645.8 (종합 6위) — [종합 보기](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결)
- [02 드래곤플라이트 게임 테스트](../02_dragonflight_game_test/README.md#9-결과--v1) — v1: 9위 / 총점 560 — 첫 프레임 예외(초기화 전 그리기)로 검은 화면, 실행 불가로 1-1 0점 · [v2](../02_dragonflight_game_test/README.md#9-2-결과--v2): 9위 / 총점 544 — v1 부터 실행 불가라 실행 불가 규칙(R3)으로 실측 0 · [v3](../02_dragonflight_game_test/README.md#9-3-결과--v3): 9위 / 총점 384 — v1 부터의 첫 프레임 예외로 실행 불가(실측 0)
- 드래곤플라이트 종합: v1 560 → v2 544 → v3 384, 평균 496 (종합 9위) — [종합 보기](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결)
- [03 디펜스 게임 테스트](../03_defense_game_test/README.md#9-결과--v1) — v1: 6위 / 총점 682 — 경로형 타워 디펜스(3종, 골드 경제) — 정상 동작, 경로 위 배치 제한이 서술과 다르고 재시작 없음 (v2·v3 결과는 라운드 종료 후)
