# mcv - MiniCPM-V 4.7 35B-A3B

[← 모델 목록](README.md)

## 기본 정보

| 항목 | 내용 |
|---|---|
| 풀네임 | MiniCPM-V 4.7 35B-A3B |
| 만든 곳 | OpenBMB |
| 공개일 | GGUF 저장소 2026-10-06 (원본 저장소 2026-10-07, 초안 DSpark 2026-10-14) |
| 라이선스 | Apache-2.0 (초안 모델 DSpark 도 Apache-2.0) |

## 원본 · GGUF 출처

- GGUF: https://huggingface.co/openbmb/MiniCPM-V-4.7-35B-A3B-gguf
- 초안: https://huggingface.co/openbmb/MiniCPM-V-4.7-35B-A3B-DSpark-gguf

## 구조

MoE. 전체 35B 중 활성 3B. 시리즈 첫 MoE 이며 이미지·영상 이해에 특화된 비전 모델이다.

## 양자화 · 파일

| 항목 | 내용 |
|---|---|
| 양자화 | Q6_K |
| 파일 | `MiniCPM-V-4_7-35B-A3B-Q6_K.gguf` · 28.5GB (28,513,556,640 B) · `fcbe98ad681730bc` |
| mmproj | `mmproj-model-f16.gguf` · 1.1GB · `bff3b688e14c300e` |
| 초안 | DSpark `dspark-...-Q8_0.gguf` · 0.42GB · `9d23bebd6079cace` |

## 서버 설정 (router preset)

공통값: `n-gpu-layers = 999`(전부 GPU) · `flash-attn = on` · `jinja = true` · `c = 65536`(문맥 64K) · `load-mode = none`(통째로 메모리에 올림). 모델 섹션이 같은 키를 쓰면 공통값을 덮어쓴다.

- 생각 모드: 끔 (카드의 instruct 모드, `enable_thinking: false`)
- 샘플링: `temp = 0.7`, `top-p = 0.95`, `top-k = 100`, `min-p = 0` (모델 카드 instruct 권장값)
- 투기적 디코딩: `model-draft` = DSpark 초안, `spec-type = draft-dspark`
- 문맥: 64K(공통값)
- mmproj: 있음
- **엔진: llama.cpp PR #29416(2026-10-10 병합) 이상, 곧 b11701 이상이 필요하다.** 10-09 빌드인 b11539 에는 이 PR 이 없다.

## 표준 시험 실측

2026-10-17, llama.cpp b11701, Strix Halo 서버(GPU, 한 번에 한 모델). 방법은 [README](README.md#읽는-법) 참고.

| 항목 | 내용 |
|---|---|
| 첫 응답(모델 교체 포함) | 24.1초 |
| 생성 속도 | 90.1 t/s |
| 긴 프롬프트 읽기(약 1만 토큰) | 1052 t/s |
| GTT | 32.2G |
| 초안 수락률 | DSpark 75% (307/411) |
| 자동 채점 통과 횟수 | 1/1회 |

## 알려진 특성 · 주의점

- 활성 3B MoE 에 초안 모델이 붙어 생성이 `q36` 수준으로 빠르다.
- 이미지·영상 이해용이라 코딩 에이전트 과제와 용도가 다르다. 이미지 입력은 이번 표준 시험에서 시험하지 않았다.
- 표본이 1회뿐이다.

## 참가한 테스트

- [01 테트리스 게임 테스트](../01_tetris_game_test/README.md#9-결과--v1) — v1: 1위 / 총점 786.5 — 가장 완결된 구현(2분 9초), 일시정지를 걸면 풀 수 없음 (v2·v3 결과는 라운드 종료 후)
