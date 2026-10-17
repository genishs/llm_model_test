# 모델 정보 (00_model_info)

이 폴더는 로컬 LLM 15종의 제원·출처·서버 설정·실측값을 모델별로 정리한 것이다. 시험(대회) 결과는 이곳이 아니라 레포 루트의 번호 붙은 시험 폴더(`01_`, `02_`, …, 예: `01_tetris_game_test`)에 있고, 모델 파일의 맨 아래 「참가한 테스트」에서 연결한다.

## 15개 모델 요약 — 한 장으로 보기

| 약어 | 풀네임 | 발표처(공개) | 파라미터(전체 / 활성) | 필요 메모리(파일) | 실측 점유(GTT) | 특징 | 테트리스 종합(3라운드 평균) | 드래곤플라이트 종합(3라운드 평균) | 디펜스 종합(3라운드 평균) | 대회 종합(3시험 평균) |
|---|---|---|---|---|---|---|---|---|---|---|
| [cn](cn.md) | Qwen3-Coder-Next 80B-A3B | Alibaba Qwen (2026-01) | 80B / 3B | 48.7GB | 47.5G | 코딩 전용, 생각 없음. 빨리 끝내지만 핵심 규칙을 틀린 적 있음 | [674.5 (4위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [676.2 (7위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [368.3 (10위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [573 (7위)](../README.md#대회-종합--3개-시험-평균) |
| [q36](q36.md) | Qwen3.6-35B-A3B (MTP판) | Alibaba Qwen (2026-04) | 35B / 3B | 30.0GB | 30.7G | MTP 로 약 90 t/s(최고속 그룹). 테트리스 5/5. 기본 일꾼 | [637.3 (7위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [734.3 (5위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [280 (11위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [550.6 (8위)](../README.md#대회-종합--3개-시험-평균) |
| [orn](orn.md) | Ornith-1.5-35B-A3B | ornith-ai (2026-08) | 35B / 3B | 29.2GB | 30.0G | 자가 개선 강화학습. 모델 카드의 벤치 점수가 높음(직접 검증 안 함), 약 81 t/s | [539.8 (8위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [826.7 (4위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [832.3 (2위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [732.9 (3위)](../README.md#대회-종합--3개-시험-평균) |
| [mg](mg.md) | Muse Glimmer 30B | Meta (2026-08) | 30B / 30B (dense) | 19.7 + 1.6GB | 22.7G | 생각 강도 low/xhigh. 느리지만(약 25 t/s) 이전 실전 완성도 1위 | [645.8 (6위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [496 (9위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [763.3 (4위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [635.1 (6위)](../README.md#대회-종합--3개-시험-평균) |
| [fn](fn.md) | Qwen3.8-Flash-Next GSQ-RCO Coder | Qwen 원본(2026-08) → ISTA-DASLab 압축 | 125B / 6B (+ n-gram 임베딩 51B), 전문가 절반 제거 | 58.4GB | 30.2G (+28.8GB 디스크 mmap) | 약 1.9비트 초압축, 약 24 t/s. 같은 빈 배열 버그 반복 | [358.7 (9위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [836.7 (3위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [440.7 (7위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [545.3 (9위)](../README.md#대회-종합--3개-시험-평균) |
| [ff](ff.md) | Qwen3.8-Flash-Next GSQ-RCO 전체판 | 같음 | 125B / 6B (+ 51B), 전문가 512개 | 75.8GB | 46.5G (+28.8GB 디스크 mmap) | RAM 여유가 가장 적음(최저 11.6G). 약 24 t/s | [886.5 (1위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [850.7 (2위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [893 (1위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [876.7 (1위)](../README.md#대회-종합--3개-시험-평균) |
| [mel](mel.md) | Mellum 2.1 12B-A2.5B Thinking | JetBrains (2026-09) | 12B / 2.5B | 12.9GB | 13.4G | 생각 모델. b11539 에서 읽기 약 2000 t/s·생성 약 85 t/s (b11701 에선 4.7배 느림, PR #30584) | [237.7 (12위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [385 (12위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [417.3 (8위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [346.7 (11위)](../README.md#대회-종합--3개-시험-평균) |
| [q38](q38.md) | Qwen3.8-27B | Alibaba Qwen (2026-08) | 27B / 27B (dense) | 22.0GB | 27.7G | MTP, 생각 끔, 약 25 t/s | [745.2 (2위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [894.7 (1위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [619.7 (6위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [753.2 (2위)](../README.md#대회-종합--3개-시험-평균) |
| [aw](aw.md) | Qwen-AgentWorld-35B-A3B | Alibaba Qwen (2026-06) | 35B / 3B | 29.3GB | 28.9G | 세계 모델(환경 시뮬레이터) — 코딩 에이전트용 아님. 생각을 길게 함 | [737.5 (3위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [504 (8위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [803.7 (3위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [681.7 (5위)](../README.md#대회-종합--3개-시험-평균) |
| [c7](c7.md) | Qwen2.5-Coder-7B-Instruct | Alibaba Qwen (2024-09) | 7B / 7B | 8.1GB | 9.6G | 옛 세대 기준선, 문맥 32K | [0 (공동 13위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [0 (공동 13위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [0 (공동 13위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [0 (공동 13위)](../README.md#대회-종합--3개-시험-평균) |
| [c7r](c7r.md) | c7 + 자체 학습 React LoRA | 직접 학습 (2026-06) | 7B + 어댑터 80MB | 8.1GB (+어댑터 80MB) | 9.6G | 직접 학습한 LoRA 예시(어댑터 비공개) | [0 (공동 13위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [0 (공동 13위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [0 (공동 13위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [0 (공동 13위)](../README.md#대회-종합--3개-시험-평균) |
| [c1](c1.md) | Qwen2.5-Coder-1.5B-Instruct | Alibaba Qwen (2024-09) | 1.5B / 1.5B | 3.1GB | 4.3G | 가장 작음. 읽기 약 3000 t/s | [0 (공동 13위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [0 (공동 13위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [0 (공동 13위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [0 (공동 13위)](../README.md#대회-종합--3개-시험-평균) |
| [bolt](bolt.md) | NVIDIA Nemotron 3.5 Bolt 74B-A9B 24GB | NVIDIA (2026-10) | 74B / 9B | 22.0 + 1.7 + 1.0GB | 28.8G | 공식 2비트 QAT, 로컬 에이전트용, 이미지·영상 입력, DFlash. 생각 기본 끔 | [307 (10위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [469.3 (10위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [383.7 (9위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [386.7 (10위)](../README.md#대회-종합--3개-시험-평균) |
| [lfm](lfm.md) | LFM2.5-24B-A2B | Liquid AI (2026-10) | 24B / 2B | 25.5GB | 25.4G | 도구 호출 에이전트용, 약 75 t/s, 읽기 약 1800 t/s, 생각을 길게 함 | [282.7 (11위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [398.7 (11위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [201.3 (12위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [294.2 (12위)](../README.md#대회-종합--3개-시험-평균) |
| [mcv](mcv.md) | MiniCPM-V 4.7 35B-A3B | OpenBMB (2026-10) | 35B / 3B | 28.5 + 1.1 + 0.4GB | 32.2G | 이미지·영상 이해 특화, DSpark 초안으로 약 90 t/s | [648.8 (5위)](../01_tetris_game_test/README.md#10-테트리스-종합--v1--v2--v3-완결) | [695 (6위)](../02_dragonflight_game_test/README.md#10-드래곤플라이트-종합--v1--v2--v3-완결) | [704.3 (5위)](../03_defense_game_test/README.md#10-03-디펜스-종합--v1--v2--v3-완결) | [682.7 (4위)](../README.md#대회-종합--3개-시험-평균) |

필요 메모리 = 모델 파일 크기, 실측 점유 = 이 서버에서 올렸을 때의 GPU 공유 메모리(GTT). 속도는 표준 시험 값(상세는 각 모델 파일).

## 이 모델들은 무엇인가

코딩 에이전트에 쓸 수 있는지 보려고 한 대의 로컬 서버에 올려 본 오픈 가중치 모델 15종이다. Qwen·Meta·JetBrains·NVIDIA·Liquid AI·OpenBMB 등 서로 다른 곳에서 만든 MoE·dense 모델이 섞여 있고, 기준선으로 옛 세대의 작은 코더 모델과 직접 학습한 LoRA 예시도 하나 포함했다.

- **서버**: Strix Halo 서버 - AMD Strix Halo, 내장 GPU Radeon 8060S(gfx1151), 64GB 통합 메모리 중 GPU 공유 메모리(GTT) 56GiB.
- **엔진**: llama.cpp **b11701** (Vulkan). 모델은 llama.cpp router 모드에서 **한 번에 하나씩** 올라가며, 요청의 `model` 값(= 약어)으로 교체된다(교체에 대체로 17~30초).
- **예외 - `mel`**: b11701 에서는 llama.cpp PR #30584 가 Mellum 의 `ffn_moe_down` 을 F32 정밀도로 강제하는데, Vulkan 이 이 연산을 GPU 에서 지원하지 않아 CPU 로 넘어간다. 그 결과 생성이 4.7배 느려진다(직접 생성 81.7 -> 17.5 t/s). 이 서버의 Vulkan GPU 에서는 이전 빌드 b11539 에서도 NaN 이 없었고 퍼플렉서티도 같아(6.097 대 6.105) 정확도 이득 없이 속도만 잃는다. 그래서 **테트리스 대회에서는 `mel` 만 b11539 로 돌린다.** 자세한 내용은 [mel.md](mel.md).
- `bolt` 는 llama.cpp 가 PR #30520 이상(b11701)이어야, `mcv` 는 PR #29416 이상이어야 로드된다.

## 읽는 법

- 「표준 시험」은 2026-10-17 같은 하네스로 모델을 한 번에 하나씩 GPU 에서 돌린 값이다. 코드 두 함수(`rotateMatrix`, `clearLines`)를 쓰게 해 정답과 자동 대조하고, 이어서 약 1만 토큰짜리 긴 프롬프트를 읽게 한다. 값은 b11701 기준이며 `mel` 만 b11539 값을 따로 적었다.
- 채점은 확률적이라 **통과 횟수**(두 함수가 모두 맞은 실행 수 / 전체 실행 수)로 적는다. 표본이 1~3회뿐이라 순위로 쓰지 않는다.
- 파일 크기 GB 는 10^9 바이트, sha256 은 앞 16자. 공개일은 제작사의 첫 Hugging Face 저장소 생성일 기준이라 실제 발표일과 며칠 다를 수 있다.
- 파라미터는 「전체 / 활성」. 활성은 토큰마다 실제로 계산에 쓰이는 파라미터다. 이 서버는 메모리 대역폭이 속도를 정하므로 활성이 작을수록 빠른 경향이 있다.
- GTT 는 모델이 올라갔을 때 GPU 공유 메모리 사용량(가중치 + KV 캐시 + 버퍼)이다.

## 한눈에 보기

| 약어 | 풀네임 | 만든 곳 | 공개일 | 파라미터 (전체 / 활성) | 구조 | 양자화 · 파일 크기 | 실측 GTT | 라이선스 | 상세 |
|---|---|---|---|---|---|---|---|---|---|
| `cn` | Qwen3-Coder-Next 80B-A3B | Qwen | 2026-01-30 | 80B / 3B | MoE, 코딩 전용 | Q4_K_M · 48.7GB | 47.5G | Apache-2.0 | [cn.md](cn.md) |
| `q36` | Qwen3.6-35B-A3B | Qwen | 2026-04-15 | 35B / 3B | MoE, 범용 | UD-Q6_K · 30.0GB | 30.7G | Apache-2.0 | [q36.md](q36.md) |
| `orn` | Ornith-1.5-35B-A3B | ornith-ai | 2026-08-18 | 35B / 3B | MoE, 추론 모델 | Q6_K · 29.2GB | 30.0G | MIT | [orn.md](orn.md) |
| `mg` | Muse Glimmer 30B | Meta | 2026-08-09 | 30B / 30B | dense, 에이전트용 | Q4_K_XL · 19.7GB (+초안 1.6GB) | 22.7G | Apache-2.0 | [mg.md](mg.md) |
| `fn` | Qwen3.8-Flash-Next GSQ-RCO Coder (가지치기) | Qwen(원본) / ISTA-DASLab(압축) | 2026-08-24 | 원본 125B / 6B (전문가 절반 제거판) | MoE | IQ1_M · 58.4GB (2조각) | 30.2G | 원본 Qwen Community License 1.0 (저장소 표기 Apache-2.0) | [fn.md](fn.md) |
| `ff` | Qwen3.8-Flash-Next GSQ-RCO 전체판 | Qwen(원본) / ISTA-DASLab(압축) | 2026-08-24 | 125B / 6B | MoE | IQ3_XXS · 75.8GB (2조각) | 46.5G | 원본 Qwen Community License 1.0 (저장소 표기 Apache-2.0) | [ff.md](ff.md) |
| `mel` | Mellum2.1-12B-A2.5B Thinking | JetBrains | 2026-09-20 | 12B / 2.5B | MoE, 생각 모델 | Q8_0 · 12.9GB | 13.4G | Apache-2.0 | [mel.md](mel.md) |
| `q38` | Qwen3.8-27B | Qwen | 2026-08-05 | 27B / 27B | dense, 생각 모델 | UD-Q6_K · 22.0GB | 27.7G | Apache-2.0 | [q38.md](q38.md) |
| `aw` | Qwen-AgentWorld-35B-A3B | Qwen | 2026-06-22 | 35B / 3B | MoE, 세계 모델 | UD-Q6_K · 29.3GB | 28.9G | Apache-2.0 | [aw.md](aw.md) |
| `c7` | Qwen2.5-Coder-7B-Instruct | Qwen | 2024-09-17 | 7B / 7B | dense | Q8_0 · 8.1GB | 9.6G | Apache-2.0 | [c7.md](c7.md) |
| `c7r` | c7 + 자체 학습 React LoRA | Qwen(베이스) / 직접 학습(어댑터) | 베이스 2024-09-17 | 7B / 7B (+LoRA) | dense + LoRA | Q8_0 · 8.1GB (+어댑터 80MB) | 9.6G | 베이스 Apache-2.0, 어댑터 비공개 | [c7r.md](c7r.md) |
| `c1` | Qwen2.5-Coder-1.5B-Instruct | Qwen | 2024-09-18 | 1.5B / 1.5B | dense | F16 · 3.1GB | 4.3G | Apache-2.0 | [c1.md](c1.md) |
| `bolt` | NVIDIA Nemotron 3.5 Bolt 74B-A9B 24GB | NVIDIA | 2026-10-07 (GGUF 저장소) | 74B / 9B | Mamba-2 + Transformer 혼합 LatentMoE | 2비트 QAT · 22.0GB (+mmproj 1.7GB, 초안 1.0GB) | 28.8G | OpenMDW-1.1 | [bolt.md](bolt.md) |
| `lfm` | LFM2.5-24B-A2B | Liquid AI | 2026-10-09 (GGUF 저장소) | 24B / 2B | 하이브리드 MoE | Q8_0 · 25.5GB | 25.4G | LFM Open License 1.0 | [lfm.md](lfm.md) |
| `mcv` | MiniCPM-V 4.7 35B-A3B | OpenBMB | 2026-10-06 (GGUF 저장소) | 35B / 3B | MoE, 비전 특화 | Q6_K · 28.5GB (+mmproj 1.1GB, 초안 0.42GB) | 32.2G | Apache-2.0 | [mcv.md](mcv.md) |

## 표준 시험 요약 (b11701, 2026-10-17)

| 약어 | 첫 응답 | 생성 t/s | 읽기 t/s | 초안 수락률 | 통과 횟수 |
|---|---|---|---|---|---|
| `cn` | 33.4초 | 55.8 | 745 | - | 2/2 |
| `q36` | 22.1초 | 91.3 | 1001 | MTP 85% | 1/2 |
| `orn` | 23.6초 | 81.0 | 965 | MTP 63% | 2/2 |
| `mg` (low) | 65.5초 | 25.7 | 331 | DFlash 45% | 2/2 |
| `fn` | 69.5초 | 23.6 | 357 | - | 0/2 |
| `ff` | 98.8초 | 24.3 | 315 | - | 2/2 |
| `mel` | 87.9초 | 17.9 (b11539: 84.7) | 524 (b11539: 2008) | - | 3/3 |
| `q38` | 32.3초 | 25.3 | 301 | MTP 85% | 2/2 |
| `aw` | 63.9초 | 55.5 | 1046 | - | 2/2 |
| `c7` | 34.1초 | 28.9 | 1127 | - | 2/2 |
| `c7r` | 9.4초 | 27.8 | 931 | - | 1/2 |
| `c1` | 8.8초 | 68.6 | 3057 | - | 0/2 |
| `bolt` (생각 끔) | 24.0초 | 53.7 | 415 | DFlash 71% | 2/2 |
| `lfm` | 65.4초 | 75.2 | 1834 | - | 1/1 |
| `mcv` | 24.1초 | 90.1 | 1052 | DSpark 75% | 1/1 |

「첫 응답」은 모델 교체 시간을 포함한 값이라 직전에 어떤 모델이 올라 있었는지에 따라 달라진다.

## 라이선스 주의

- `fn`·`ff`: 원본 Qwen3.8-Flash-Next 는 Qwen Community License 1.0 이다. 압축판 저장소(ISTA-DASLab)는 Apache-2.0 으로 표기하지만 더 엄격한 쪽(원본)을 따라야 한다.
- `orn`: 저장소는 MIT 이지만 모델 카드에 Qwen3.5/Gemma4 기반이라고 적혀 있어 상속 조건을 원 모델 라이선스에서 확인해야 한다.
- `lfm`: 연 매출 1천만 달러 미만 무료 상업 이용. 조건 전문은 모델 페이지에서 확인한다.
- 표의 라이선스는 각 저장소가 표기한 값이며 법률 자문이 아니다. 이 폴더는 모델 가중치를 포함하지 않는다.

## 수치의 출처와 한계

- 수치는 서버 로그와 자체 시험 하네스에서 집계한 값이며 제작사의 공식 수치가 아니다.
- 표준 시험의 통과 횟수는 표본이 1~3회라 경향으로만 읽는다.
- 같은 항목에 이전 측정과 새 측정이 다르면 새 측정(2026-10-17, b11701)을 기본으로 적고 이전 값은 「과거 실측」으로 따로 적었다.
