# ff - Qwen3.8-Flash-Next GSQ-RCO 전체판

[← 모델 목록](README.md)

## 기본 정보

| 항목 | 내용 |
|---|---|
| 풀네임 | Qwen3.8-Flash-Next GSQ-RCO (IQ3_XXS, 전문가 전부 유지) |
| 만든 곳 | Qwen(원본) / ISTA-DASLab(압축) |
| 공개일 | 원본 2026-08-24 · GGUF 저장소 2026-09-07 |
| 라이선스 | 원본 Qwen3.8-Flash-Next 는 **Qwen Community License 1.0** (제3자에게 추론 접근을 제공하는 MaaS 사업이나 AI 코딩·업무 보조 제품 사업 등 상업 목적 사용에는 Qwen 의 별도 라이선스가 필요하고, 제3자에게 제공하지 않는 내부 사용은 예외). ISTA-DASLab GGUF 저장소는 Apache-2.0 으로 표기하지만 더 엄격한 쪽(원본)을 따른다 - https://huggingface.co/Qwen/Qwen3.8-Flash-Next/blob/main/LICENSE |

## 원본 · GGUF 출처

- 원본: https://huggingface.co/Qwen/Qwen3.8-Flash-Next
- GGUF: https://huggingface.co/ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF

## 구조

MoE. 원본 그대로 전체 125B / 활성 6B (공식 모델 카드: 여기에 n-gram 임베딩 51B, MTP 4B 가 별도로 있다). 전문가 512개를 모두 유지한 압축판.

## 양자화 · 파일

| 항목 | 내용 |
|---|---|
| 양자화 | IQ3_XXS |
| 파일 | 2조각 합계 75.8GB: `...IQ3_XXS-00001-of-00002.gguf` 47,039,860,096 B · `219ea929900dfa9e` / `...IQ3_XXS-00002-of-00002.gguf` 28,800,138,432 B · `316b46f3a2dbd68c` (둘째 조각은 `fn` 과 같은 파일) |

## 서버 설정 (router preset)

공통값: `n-gpu-layers = 999`(전부 GPU) · `flash-attn = on` · `jinja = true` · `c = 65536`(문맥 64K) · `load-mode = none`(통째로 메모리에 올림). 모델 섹션이 같은 키를 쓰면 공통값을 덮어쓴다.

- 생각 모드: 끔 (`enable_thinking: false`)
- 샘플링: `temp = 0.7`, `top-p = 0.8`, `top-k = 20`, `min-p = 0`, `presence-penalty = 1.5` (양자화판의 반복을 억제하려는 설정)
- 투기적 디코딩: 없음
- 문맥: 64K(공통값)
- mmproj: 없음
- 메모리: `load-mode = mmap` + `override-tensor = per_layer_token_embd=CPU` - 28.8GB 인 이 텐서 하나를 GPU 에 올리지 않고 CPU 쪽에서 mmap 으로 필요한 줄만 읽는다.
- `fn` 과 같은 설정이다.

## 표준 시험 실측

2026-10-17, llama.cpp b11701, Strix Halo 서버(GPU, 한 번에 한 모델). 방법은 [README](README.md#읽는-법) 참고.

| 항목 | 내용 |
|---|---|
| 첫 응답(모델 교체 포함) | 98.8초 (15종 중 가장 김) |
| 생성 속도 | 24.3 t/s |
| 긴 프롬프트 읽기(약 1만 토큰) | 315 t/s |
| GTT | 46.5G (+ mmap 28.8GB) |
| 초안 수락률 | - (없음) |
| 자동 채점 통과 횟수 | 2/2회 |

시험 중 남은 RAM 최저 11.6G.

## 알려진 특성 · 주의점

- 메모리가 가장 빠듯한 모델이다. GTT 46.5G 에 더해 28.8GB 를 mmap 으로 읽어, 시험 중 남은 RAM 이 11.6G 까지 줄었다(GTT 점유만 보면 `cn` 47.5G 가 더 크다).
- 10-11 벤치에서는 생각을 켜면 결과 0바이트(생각만 함)였고, `fn` 과 같은 비생각 샘플링으로 바꾼 표준 시험은 2회 모두 통과했다.
- 라이선스: 원본의 Qwen Community License 1.0 을 확인하고 쓴다.

## 참가한 테스트

- [01 테트리스 게임 테스트](../01_tetris_game_test/README.md) — 결과는 대회 종료 후 기입
