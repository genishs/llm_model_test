# orn - Ornith-1.5-35B-A3B

[← 모델 목록](README.md)

## 기본 정보

| 항목 | 내용 |
|---|---|
| 풀네임 | Ornith-1.5-35B-A3B |
| 만든 곳 | ornith-ai |
| 공개일 | 원본 2026-08-18 · GGUF 저장소 2026-08-18 |
| 라이선스 | MIT (모델 카드에 Qwen3.5/Gemma4 기반이라고 적혀 있어 상속 조건은 원 모델 라이선스도 확인) |

## 원본 · GGUF 출처

- GGUF(원본 저장소와 동일 조직): https://huggingface.co/ornith-ai/Ornith-1.5-35B-A3B-GGUF

## 구조

MoE. 전체 35B 중 활성 3B. Qwen3.5/Gemma4 기반 자가개선 강화학습을 거친 추론 모델(기본은 생각 켬). 파일 헤더에 MTP(`nextn`) 층이 있다.

## 양자화 · 파일

| 항목 | 내용 |
|---|---|
| 양자화 | Q6_K |
| 파일 | `Ornith-1.5-35B-Q6_K.gguf` · 29.2GB (29,208,731,392 B) |
| sha256(앞 16자) | `15d4658bbfc9c603` |

## 서버 설정 (router preset)

공통값: `n-gpu-layers = 999`(전부 GPU) · `flash-attn = on` · `jinja = true` · `c = 65536`(문맥 64K) · `load-mode = none`(통째로 메모리에 올림). 모델 섹션이 같은 키를 쓰면 공통값을 덮어쓴다.

- 생각 모드: 끔 (`enable_thinking: false`). 모델 카드의 벤치 점수는 생각을 켠 값이다.
- 샘플링: `temp = 0.6`, `top-p = 0.95`, `top-k = 20` (모델 카드 권장값)
- 투기적 디코딩: `spec-type = draft-mtp` (내장 MTP 층)
- 문맥: 64K(공통값)
- mmproj: 없음

## 표준 시험 실측

2026-10-17, llama.cpp b11701, Strix Halo 서버(GPU, 한 번에 한 모델). 방법은 [README](README.md#읽는-법) 참고.

| 항목 | 내용 |
|---|---|
| 첫 응답(모델 교체 포함) | 23.6초 |
| 생성 속도 | 81.0 t/s |
| 긴 프롬프트 읽기(약 1만 토큰) | 965 t/s |
| GTT | 30.0G |
| 초안 수락률 | MTP 63% |
| 자동 채점 통과 횟수 | 2/2회 |

## 알려진 특성 · 주의점

- 과거 실측: 짧은 시험에서 생성 94 t/s(MTP 87%), 실전 평균 49 t/s(MTP 66%) · 읽기 600~630 t/s.
- 모델 카드의 벤치 점수(Terminal-Bench 2.1 67.8, SWE-bench Verified 79)는 직접 검증하지 않았다.
- 서브에이전트(팀 작업)를 가장 성실히 돌리는 편이다.

## 참가한 테스트

- [01 테트리스 게임 테스트](../01_tetris_game_test/README.md#9-결과--v1) — v1: 6위 / 총점 661.5 — SRS·7-bag·홀드까지 로직은 정교하나 초기 렌더 예외로 화면이 그려지지 않음 (v2·v3 결과는 라운드 종료 후)
