# aw - Qwen-AgentWorld-35B-A3B

[← 모델 목록](README.md)

## 기본 정보

| 항목 | 내용 |
|---|---|
| 풀네임 | Qwen-AgentWorld-35B-A3B |
| 만든 곳 | Qwen (GGUF 변환: unsloth) |
| 공개일 | 원본 2026-06-22 · GGUF 저장소 2026-06-24 |
| 라이선스 | Apache-2.0 |

## 원본 · GGUF 출처

- 원본: https://huggingface.co/Qwen/Qwen-AgentWorld-35B-A3B
- GGUF: https://huggingface.co/unsloth/Qwen-AgentWorld-35B-A3B-GGUF

## 구조

MoE. 전체 35B 중 활성 3B. **세계 모델(environment simulator)** - 도구·환경의 반응을 흉내 내는 시뮬레이터이며 코딩 에이전트가 아니다.

## 양자화 · 파일

| 항목 | 내용 |
|---|---|
| 양자화 | UD-Q6_K |
| 파일 | `Qwen-AgentWorld-35B-A3B-UD-Q6_K.gguf` · 29.3GB (29,308,321,024 B) |
| sha256(앞 16자) | `cce7ec62095093b9` |

## 서버 설정 (router preset)

공통값: `n-gpu-layers = 999`(전부 GPU) · `flash-attn = on` · `jinja = true` · `c = 65536`(문맥 64K) · `load-mode = none`(통째로 메모리에 올림). 모델 섹션이 같은 키를 쓰면 공통값을 덮어쓴다.

- 생각 모드: 서버 설정 없음(시험에서 생각이 켜진 채 동작, 약 7.2천 자)
- 샘플링: 모델 기본값
- 투기적 디코딩: 없음
- 문맥: 64K(공통값)
- mmproj: 없음

## 표준 시험 실측

2026-10-17, llama.cpp b11701, Strix Halo 서버(GPU, 한 번에 한 모델). 방법은 [README](README.md#읽는-법) 참고.

| 항목 | 내용 |
|---|---|
| 첫 응답(모델 교체 포함) | 63.9초 |
| 생성 속도 | 55.5 t/s |
| 긴 프롬프트 읽기(약 1만 토큰) | 1046 t/s |
| GTT | 28.9G |
| 초안 수락률 | - (없음) |
| 자동 채점 통과 횟수 | 2/2회 |

## 알려진 특성 · 주의점

- 용도가 달라 코딩 에이전트 비교 대상이 아니다. 대회 결과를 읽을 때 「코딩용으로 만들어지지 않은 모델」임을 감안한다.
- 비교·참고용으로만 router 에 둔다.

## 참가한 테스트

- [01 테트리스 게임 테스트](../01_tetris_game_test/README.md#9-결과--v1) — v1: 3위 / 총점 756.5 — 규칙은 가장 정확하나 시간 비교 오류로 자동 낙하가 없음 · [v2](../01_tetris_game_test/README.md#9-2-결과--v2): 2위 / 총점 816 — 버튼·길게 누르기는 동작, v1 의 자동 낙하 없음은 그대로, 터치 일시정지 없음 · [v3](../01_tetris_game_test/README.md#9-3-결과--v3): 5위 / 총점 640 — 컨티뉴가 보드를 비우지 않아 즉시 다시 게임 오버, v2 부터의 중력 없음도 그대로
- 테트리스 종합: v1 756.5 → v2 816 → v3 640, 평균 737.5 (종합 3위) — [종합 보기](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결)
- [02 드래곤플라이트 게임 테스트](../02_dragonflight_game_test/README.md#9-결과--v1) — v1: 공동 12위 / 총점 0 — 제작 실패 — 7분 17초 동안 생성했지만(요청 2회, 생성 토큰 21,474개) 파일을 만들지 못함 · [v2](../02_dragonflight_game_test/README.md#9-2-결과--v2): 7위 / 총점 756 — v1 빈 폴더에서 처음 게임을 만듦 — 사격·코인·보스가 없는 장애물 회피 게임, 터치는 만점 (v3 결과는 라운드 종료 후)
