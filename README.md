# llm_model_test — 로컬 LLM 15종 코딩 대회

같은 지시문으로 로컬 LLM 15종에게 브라우저용 게임을 만들게 하고, 실행 시험과 코드 리뷰로 1000점 만점 순위를 매긴다. 시험은 둘이고, 각각 세 라운드(v1 만들기 → v2 터치 조작 → v3 아케이드 기능)로 이어진다.

## 시험 목록
- [01 테트리스](./01_tetris_game_test/) — v1 만들기, v2 터치 조작, v3 레벨·크레딧·컨티뉴
- [02 드래곤플라이트](./02_dragonflight_game_test/) — v1 만들기, v2 터치 조작, v3 스테이지·크레딧·컨티뉴

각 테스트 페이지에 라운드별 결과 게임 카드(점수·플레이·코드 링크)와 README(지시문 원문, 채점 방법, 결과 분석)가 있다. 참가 모델 15종의 제원은 [모델 정보](https://github.com/genishs/llm_model_test/tree/main/00_model_info) 에 있다.

## 규칙
- 서버: AMD Strix Halo(Radeon 8060S, 통합 메모리 64GB) · llama.cpp b11701 router 모드 · 모델은 한 번에 하나.
- `mel` 만 b11539 엔진(이유는 01 README 4절).
- 에이전트: opencode v1.18.35 `opencode run --auto --pure -m halo/<약어>`(`--pure` 는 외부 플러그인 없이 실행) — 모델마다 새 세션, 같은 지시문(폴더 이름만 다름).
- 샌드박스(bubblewrap): 각 모델은 **자기 폴더와 일회용 임시 홈에만 쓸 수 있고** 다른 모델의 폴더·서버의 다른 파일은 보이지 않는다. 웹 가져오기(webfetch) 도구는 거부했다. 셸 네트워크는 막지 않았다 — 아래 감사 결과 참고. 1회 최대 60분.
- 네트워크 사용 감사(2026-10-17 기준): 실행 기록에서 모델이 셸로 외부에 접속한 흔적 **0건 / 결과물 반영 0건**. 게임 파일의 외부 URL(CDN·폰트 등)도 0건. 상세는 각 테스트 README 5절.
- 각 모델의 router 기본 설정 그대로(생각 모드·샘플링은 모델별 프리셋).

## 지시문
아래는 01 테트리스 v1 지시문의 요약이다. 전체 원문(v1·v2·v3)과 02 드래곤플라이트의 지시문은 각 테스트 README 3절에 있다.

`simple_llm_test_<약어>_tetris_v1` 폴더 안에 —
- 아타리(Atari Games, 1988년 아케이드판) 테트리스의 게임성과 그래픽을 최대한 가깝게 재현
- 설치·빌드·서버 없이 `index.html` 을 브라우저로 열면 바로 실행
- 필요한 파일은 모두 이 폴더 안에
- 게임 소개·실행 방법·조작법·파일 구성을 담은 `README.md`

## 평가 (1000점)
라운드마다 채점 기준이 다르다(v1 기본 게임 / v2 터치 조작 / v3 아케이드 기능). 모든 라운드가 1000점 만점이고, 루브릭과 채점 방법은 각 테스트 README 7절에 있다.

종합 순위 = 3라운드 평균(1:1:1).

결과는 각 테스트 페이지에서 본다 — [01 테트리스](./01_tetris_game_test/) · [02 드래곤플라이트](./02_dragonflight_game_test/). 점수는 결과 게임 카드에, 라운드별 분석은 테스트 README 의 결과 절(9절)에 있다.


## 바로 플레이

### 01_tetris_game_test

- [simple_llm_test_aw_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_aw_tetris_v1/index.html)
- [simple_llm_test_aw_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_aw_tetris_v2/index.html)
- [simple_llm_test_aw_tetris_v3](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_aw_tetris_v3/index.html)
- [simple_llm_test_bolt_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_bolt_tetris_v1/index.html)
- [simple_llm_test_bolt_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_bolt_tetris_v2/index.html)
- [simple_llm_test_bolt_tetris_v3](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_bolt_tetris_v3/index.html)
- simple_llm_test_c1_tetris_v1 — 파일 없음
- simple_llm_test_c1_tetris_v2 — 파일 없음
- simple_llm_test_c1_tetris_v3 — 파일 없음
- simple_llm_test_c7_tetris_v1 — 파일 없음
- simple_llm_test_c7_tetris_v2 — 파일 없음
- simple_llm_test_c7_tetris_v3 — 파일 없음
- simple_llm_test_c7r_tetris_v1 — 파일 없음
- simple_llm_test_c7r_tetris_v2 — 파일 없음
- simple_llm_test_c7r_tetris_v3 — 파일 없음
- [simple_llm_test_cn_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_cn_tetris_v1/index.html)
- [simple_llm_test_cn_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_cn_tetris_v2/index.html)
- [simple_llm_test_cn_tetris_v3](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_cn_tetris_v3/index.html)
- [simple_llm_test_ff_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_ff_tetris_v1/index.html)
- [simple_llm_test_ff_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_ff_tetris_v2/index.html)
- [simple_llm_test_ff_tetris_v3](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_ff_tetris_v3/index.html)
- simple_llm_test_fn_tetris_v1 — 파일 없음
- [simple_llm_test_fn_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_fn_tetris_v2/index.html)
- [simple_llm_test_fn_tetris_v3](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_fn_tetris_v3/index.html)
- [simple_llm_test_lfm_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_lfm_tetris_v1/index.html)
- [simple_llm_test_lfm_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_lfm_tetris_v2/index.html)
- [simple_llm_test_lfm_tetris_v3](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_lfm_tetris_v3/index.html)
- [simple_llm_test_mcv_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mcv_tetris_v1/index.html)
- [simple_llm_test_mcv_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mcv_tetris_v2/index.html)
- [simple_llm_test_mcv_tetris_v3](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mcv_tetris_v3/index.html)
- [simple_llm_test_mel_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mel_tetris_v1/index.html)
- [simple_llm_test_mel_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mel_tetris_v2/index.html)
- [simple_llm_test_mel_tetris_v3](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mel_tetris_v3/index.html)
- [simple_llm_test_mg_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mg_tetris_v1/index.html)
- [simple_llm_test_mg_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mg_tetris_v2/index.html)
- [simple_llm_test_mg_tetris_v3](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mg_tetris_v3/index.html)
- [simple_llm_test_orn_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_orn_tetris_v1/index.html)
- [simple_llm_test_orn_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_orn_tetris_v2/index.html)
- [simple_llm_test_orn_tetris_v3](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_orn_tetris_v3/index.html)
- [simple_llm_test_q36_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_q36_tetris_v1/index.html)
- [simple_llm_test_q36_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_q36_tetris_v2/index.html)
- [simple_llm_test_q36_tetris_v3](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_q36_tetris_v3/index.html)
- [simple_llm_test_q38_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_q38_tetris_v1/index.html)
- [simple_llm_test_q38_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_q38_tetris_v2/index.html)
- [simple_llm_test_q38_tetris_v3](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_q38_tetris_v3/index.html)

### 02_dragonflight_game_test

- simple_llm_test_aw_dragonflight_v1 — 파일 없음
- [simple_llm_test_bolt_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_bolt_dragonflight_v1/index.html)
- [simple_llm_test_cn_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_cn_dragonflight_v1/index.html)
- [simple_llm_test_ff_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_ff_dragonflight_v1/index.html)
- [simple_llm_test_fn_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_fn_dragonflight_v1/index.html)
- [simple_llm_test_lfm_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_lfm_dragonflight_v1/index.html)
- [simple_llm_test_mcv_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_mcv_dragonflight_v1/index.html)
- [simple_llm_test_mg_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_mg_dragonflight_v1/index.html)
- [simple_llm_test_orn_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_orn_dragonflight_v1/index.html)
- [simple_llm_test_q36_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_q36_dragonflight_v1/index.html)
- [simple_llm_test_q38_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_q38_dragonflight_v1/index.html)
