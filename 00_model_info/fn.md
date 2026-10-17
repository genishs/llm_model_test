# fn - Qwen3.8-Flash-Next GSQ-RCO Coder (가지치기)

[← 모델 목록](README.md)

## 기본 정보

| 항목 | 내용 |
|---|---|
| 풀네임 | Qwen3.8-Flash-Next GSQ-RCO Coder (IQ1_M) |
| 만든 곳 | Qwen(원본) / ISTA-DASLab(압축) |
| 공개일 | 원본 2026-08-24 · GGUF 저장소 2026-09-26 |
| 라이선스 | 원본 Qwen3.8-Flash-Next 는 **Qwen Community License 1.0** (제3자에게 추론 접근을 제공하는 MaaS 사업이나 AI 코딩·업무 보조 제품 사업 등 상업 목적 사용에는 Qwen 의 별도 라이선스가 필요하고, 제3자에게 제공하지 않는 내부 사용은 예외). ISTA-DASLab GGUF 저장소는 Apache-2.0 으로 표기하지만 더 엄격한 쪽(원본)을 따른다 - https://huggingface.co/Qwen/Qwen3.8-Flash-Next/blob/main/LICENSE |

## 원본 · GGUF 출처

- 원본: https://huggingface.co/Qwen/Qwen3.8-Flash-Next
- GGUF: https://huggingface.co/ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-Coder-GGUF

## 구조

MoE. 원본 Qwen3.8-Flash-Next 는 전체 125B / 활성 6B 이고, 공식 모델 카드에 따르면 여기에 n-gram 임베딩 51B 와 MTP 4B 가 더해진다. 이 파일은 전문가 512개 중 절반을 코딩용으로 선별해 제거한 압축판이다(제거 후 정확한 전체 파라미터 수는 확인하지 못했다). 이미지 입력이 가능하다.

## 양자화 · 파일

| 항목 | 내용 |
|---|---|
| 양자화 | IQ1_M (유효 1.89비트) |
| 파일 | 2조각 합계 58.4GB: `...IQ1_M-00001-of-00002.gguf` 29,608,446,496 B · `e11083ba855e7666` / `...IQ1_M-00002-of-00002.gguf` 28,800,138,432 B · `316b46f3a2dbd68c` |

## 서버 설정 (router preset)

공통값: `n-gpu-layers = 999`(전부 GPU) · `flash-attn = on` · `jinja = true` · `c = 65536`(문맥 64K) · `load-mode = none`(통째로 메모리에 올림). 모델 섹션이 같은 키를 쓰면 공통값을 덮어쓴다.

- 생각 모드: 끔 (`enable_thinking: false`)
- 샘플링: `temp = 0.7`, `top-p = 0.8`, `top-k = 20`, `min-p = 0`, `presence-penalty = 1.5` (양자화판의 반복을 억제하려는 설정)
- 투기적 디코딩: 없음
- 문맥: 64K(공통값)
- mmproj: 없음
- 메모리: `load-mode = mmap` + `override-tensor = per_layer_token_embd=CPU` - 28.8GB 인 이 텐서 하나를 GPU 에 올리지 않고 CPU 쪽에서 mmap 으로 필요한 줄만 읽는다.

## 표준 시험 실측

2026-10-17, llama.cpp b11701, Strix Halo 서버(GPU, 한 번에 한 모델). 방법은 [README](README.md#읽는-법) 참고.

| 항목 | 내용 |
|---|---|
| 첫 응답(모델 교체 포함) | 69.5초 |
| 생성 속도 | 23.6 t/s |
| 긴 프롬프트 읽기(약 1만 토큰) | 357 t/s |
| GTT | 30.2G |
| 초안 수락률 | - (없음) |
| 자동 채점 통과 횟수 | **0/2회** - 두 번 모두 rotateMatrix 에서 TypeError |

## 알려진 특성 · 주의점

- 실험용. `Array(n).map(...)` 이 빈 배열을 만드는 버그가 10-11 과 10-17 두 번 같은 모양으로 나왔다.
- 처음 시험(10-11)에는 생각을 켜면 결과가 0바이트, 생각을 끄고 `temp 0.2` 면 같은 문자열을 반복하며 붕괴했다. 지금 샘플링은 이를 피하려는 설정이다.
- 같은 계열의 전체판 [ff](ff.md) 는 같은 시험을 2/2회 통과했다.
- 둘째 조각은 `ff` 와 같은 파일이다.

## 참가한 테스트

- [01 테트리스 게임 테스트](../01_tetris_game_test/README.md#9-결과--v1) — v1: 공동 12위 / 총점 0 — 제작 실패, 파일을 만들지 못함(생성 토큰 61개) · [v2](../01_tetris_game_test/README.md#9-2-결과--v2): 10위 / 총점 365 — v1 빈 폴더에서 처음으로 게임을 만들었으나 첫 조각을 만들지 않아 입력마다 예외 · [v3](../01_tetris_game_test/README.md#9-3-결과--v3): 공동 3위 / 총점 711 — 시작 함수가 첫 조각을 만들어 게임이 돌아가고 레벨·카운트다운 화면 동작, 컨티뉴 후 조각 미생성과 코인 투입 수단 없음
- 테트리스 종합: v1 0 → v2 365 → v3 711, 평균 358.7 (종합 9위) — [종합 보기](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결)
- [02 드래곤플라이트 게임 테스트](../02_dragonflight_game_test/README.md#9-결과--v1) — v1: 4위 / 총점 828 — 규칙 대부분 정상이나 33분 21초(요청 378회)로 가장 오래 걸림, 방어막이 접촉을 막지 못함 · [v2](../02_dragonflight_game_test/README.md#9-2-결과--v2): 4위 / 총점 864 — 기존 코드를 거의 건드리지 않고 터치를 얹어 변경의 깔끔함 최고(46/50), 터치 시작이 새로 가능해짐 · [v3](../02_dragonflight_game_test/README.md#9-3-결과--v3): 2위 / 총점 818 — 두 바퀴 완주하나 클릭이 코인 투입과 시작을 겸해 크레딧 게이트가 무의미, 모바일 탭 1회에 크레딧 +2
- 드래곤플라이트 종합: v1 828 → v2 864 → v3 818, 평균 836.7 (종합 3위) — [종합 보기](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결)
- [03 디펜스 게임 테스트](../03_defense_game_test/README.md#9-결과--v1) — v1: 3위 / 총점 796 — 레인 고정 경로형 타워 디펜스 — 정상 동작, 업그레이드 없음·재시작은 새로고침 (v2·v3 결과는 라운드 종료 후)
