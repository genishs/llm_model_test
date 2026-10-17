# bolt - NVIDIA Nemotron 3.5 Bolt 74B-A9B 24GB

[← 모델 목록](README.md)

## 기본 정보

| 항목 | 내용 |
|---|---|
| 풀네임 | NVIDIA Nemotron 3.5 Bolt 74B-A9B 24GB |
| 만든 곳 | NVIDIA |
| 공개일 | 24GB GGUF 저장소 2026-10-07 (원본 BF16 저장소 2026-10-09, 초안 LiLiCorr 2026-10-12) |
| 라이선스 | OpenMDW-1.1 (https://openmdw.ai/license/1-1/) - 초안 모델도 같다 |

## 원본 · GGUF 출처

- GGUF: https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-74B-A9B-24GB-GGUF
- 초안: https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-74B-A9B-24GB-LiLiCorr-GGUF

## 구조

Mamba-2 + Transformer 혼합 LatentMoE. 전체 74B 중 활성 9B. 이미지·영상 입력 가능. 「로컬 에이전트·도구 호출·터미널」용으로 학습한, 64GB 장비를 겨냥한 24GB 판이다.

## 양자화 · 파일

| 항목 | 내용 |
|---|---|
| 양자화 | 공식 2비트 QAT (IQ2) |
| 파일 | `NVIDIA-Nemotron-3.5-Bolt-74B-A9B-24GB.gguf` · 22.0GB (22,018,326,528 B) · `91d63363e782c8a3` |
| mmproj | `mmproj-...-24GB.gguf` · 1.7GB · `0ee891eadc7bf0ca` |
| 초안 | LiLiCorr `...-24GB-LiLiCorr.gguf` · 1.0GB · `080e1ea41c9562a7` |

## 서버 설정 (router preset)

공통값: `n-gpu-layers = 999`(전부 GPU) · `flash-attn = on` · `jinja = true` · `c = 65536`(문맥 64K) · `load-mode = none`(통째로 메모리에 올림). 모델 섹션이 같은 키를 쓰면 공통값을 덮어쓴다.

- 생각 모드: 서버 기본은 **끔** (`enable_thinking: false`). 요청에서 `enable_thinking: true` 를 주면 켜진다(확인함). opencode variant `fast`(끔, 기본) / `think`(켬).
- 샘플링: `temp = 1.0`, `top-p = 0.95` (모델 카드 권장값)
- 투기적 디코딩: `model-draft` = LiLiCorr 초안, `spec-type = draft-dflash`, `spec-draft-n-max = 6`, `spec-draft-ngl = 999` (NVIDIA 레시피)
- 문맥: 64K(공통값)
- mmproj: 있음(C-RADIO 비전)
- 기타: `cache-type-k/v = q8_0`
- **엔진: llama.cpp b11701(PR #30520, 2026-10-15 병합) 이상 필요.**

## 표준 시험 실측

2026-10-17, llama.cpp b11701, Strix Halo 서버(GPU, 한 번에 한 모델). 방법은 [README](README.md#읽는-법) 참고.

| 항목 | 내용 |
|---|---|
| 첫 응답(모델 교체 포함) | 24.0초 (생각 끔) |
| 생성 속도 | 53.7 t/s (생각 끔) |
| 긴 프롬프트 읽기(약 1만 토큰) | 415 t/s |
| GTT | 28.8G |
| 초안 수락률 | DFlash 71% (284/402) |
| 자동 채점 통과 횟수 | 2/2회 (생각 켬 1회 + 끔 1회, 둘 다 통과) |

생각을 켠 실행: 첫 응답 103.5초(추론 약 1.25만 자) · 생성 46.3 t/s · 읽기 417 t/s · GTT 28.8G · DFlash 수락 57% (3072/5370). 생각을 끈 간이 확인(정식 측정 아님)은 생성 62.4 t/s, 작은 함수 하나 1.2초.

## 알려진 특성 · 주의점

- b11539 에서는 로드에 실패한다: `check_tensor_dims: blk.1.ffn_gate_inp.weight has wrong shape`(층마다 전문가 수가 다름), mmproj 도 읽지 못한다. 반드시 b11701 이상을 쓴다.
- 생각을 끄는 것이 서버 기본이며, 켜면 첫 응답이 4배 이상 길어진다.
- 읽기 속도(415 t/s)는 느린 편이라 문맥을 매번 다시 읽는 에이전트에서는 영향이 있다.

## 참가한 테스트

- [01 테트리스 게임 테스트](../01_tetris_game_test/README.md#9-결과--v1) — v1: 10위 / 총점 462 — 시작 직후 undefined 접근 예외로 빈 화면 · [v2](../01_tetris_game_test/README.md#9-2-결과--v2): 9위 / 총점 403 — v1 의 시작 예외 그대로, 터치 핸들러의 존재하지 않는 DOMRect.contains 호출까지 더해짐 · [v3](../01_tetris_game_test/README.md#9-3-결과--v3): 11위 / 총점 56 — 새 keydown 핸들러의 괄호 누락(문법 오류)으로 실행 불가
- 테트리스 종합: v1 462 → v2 403 → v3 56, 평균 307 (종합 10위) — [종합 보기](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결)
- [02 드래곤플라이트 게임 테스트](../02_dragonflight_game_test/README.md#9-결과--v1) — v1: 8위 / 총점 604 — 플레이어가 좌측 벽에 고정되고 검은 오버레이가 화면을 덮으며 적이 나오지 않음 · [v2](../02_dragonflight_game_test/README.md#9-2-결과--v2): 10위 / 총점 467 — v2 에서 변수 중복 선언 문법 오류로 스크립트 전체가 죽어 v1 에서 되던 기능까지 회귀(유일한 회귀) · [v3](../02_dragonflight_game_test/README.md#9-3-결과--v3): 공동 10위 / 총점 337 — v2 의 중복 선언 문법 오류를 그대로 둬 실행 불가, 크레딧 투입 경로 없음
- 드래곤플라이트 종합: v1 604 → v2 467 → v3 337, 평균 469.3 (종합 10위) — [종합 보기](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결)
- [03 디펜스 게임 테스트](../03_defense_game_test/README.md#9-결과--v1) — v1: 9위 / 총점 451 — 마우스 방향 화살 사격형 — 웨이브 카운터 버그로 1.7초 만에 승리, 패배 없음 (v2·v3 결과는 라운드 종료 후)
