# llm_model_test — 로컬 LLM 15종 코딩 대회

같은 지시문으로 로컬 LLM 15종에게 브라우저용 게임을 만들게 하고, 실행 시험과 코드 리뷰로 1000점 만점 순위를 매긴다. 시험마다 세 라운드(v1 만들기 → v2 터치 조작 → v3 새 기능)로 이어진다. 지금 시험은 둘이고, 세 번째(03 디펜스)를 준비 중이다.

## 시험 목록
- [01 테트리스](./01_tetris_game_test/) — v1 만들기, v2 터치 조작, v3 레벨·크레딧·컨티뉴
- [02 드래곤플라이트](./02_dragonflight_game_test/) — v1 만들기, v2 터치 조작, v3 스테이지·크레딧·컨티뉴
- [03 디펜스](./03_defense_game_test/)(준비 중) — v1 만들기(장르·기획·디자인은 모델에 맡김), v2 터치 조작, v3 4스테이지마다 보스전

각 테스트 페이지에 라운드별 결과 게임 카드(점수·플레이·코드 링크)와 README(지시문 원문, 채점 방법, 결과 분석)가 있다. 참가 모델 15종의 제원은 [모델 정보](https://github.com/genishs/llm_model_test/tree/main/00_model_info) 에 있다.

## 규칙
### 모든 시험 공통
- 서버: AMD Strix Halo(Radeon 8060S, 통합 메모리 64GB) · llama.cpp b11701 router 모드 · 모델은 한 번에 하나.
- `mel` 만 b11539 엔진(이유는 01 README 4절).
- 에이전트: opencode v1.18.35 `opencode run --auto --pure -m halo/<약어>`(`--pure` 는 외부 플러그인 없이 실행) — 모델마다 새 세션, 같은 지시문(폴더 이름만 다름).
- 샌드박스(bubblewrap): 디스크 전체를 읽기 전용으로 두고, 각 모델은 **자기 폴더와 일회용 임시 홈에만 쓸 수 있고** 다른 모델의 폴더·서버의 다른 파일은 보이지 않는다.
- 각 모델의 router 기본 설정 그대로(생각 모드·샘플링은 모델별 프리셋).

### 시험마다 다른 조건
- **만들 게임** — 01·02: 정해 준 게임(01 아타리 1988 테트리스, 02 드래곤플라이트의 게임성) · 03: 장르 해석·기획·디자인까지 모델에 맡김
- **시간 제한** — 01: 모델당 1회 최대 60분 · 02: 모델당 라운드당 최대 60분 · 03: **모델당 라운드당 15분**
- **웹 가져오기(webfetch)** — 01·02: 거부 · 03: **허용**(인터넷 검색, 외부 라이브러리·이미지·소리 사용. 출처·라이선스는 README.md 에 적게 함)
- **서브에이전트·페르소나** — 01: 지시문에 언급 없음 · 02: 서브에이전트 사용 허용 · 03: 페르소나·서브에이전트 사용 허용
- **셸 네트워크** — 01·02: 막지 않음 · 03: 허용

- 01·02 에서는 웹 가져오기 도구만 거부했고 셸 네트워크는 막지 않았다. 그래서 감사했다 — 네트워크 사용 감사(2026-10-17 기준): 실행 기록에서 모델이 셸로 외부에 접속한 흔적 **0건 / 결과물 반영 0건**. 게임 파일의 외부 URL(CDN·폰트 등)도 0건. 상세는 각 테스트 README 5절.
- 03 은 인터넷을 쓰는 것이 조건의 일부라서, 01·02 의 네트워크 감사와 같은 기준을 적용하지 않는다.

## 지시문
### 공통 조건
모든 시험·라운드의 지시문에 들어 있는 조건이다. 지시문은 모델마다 폴더 이름(약어)만 다르고 나머지는 같다.
- 각 모델은 자기 폴더 `simple_llm_test_<약어>_<시험>_v<N>` 안에서 작업한다.
- 별도 설치·빌드·서버 없이 `index.html` 을 브라우저로 열면 바로 실행되어야 한다.
- 필요한 파일은 모두 그 폴더 안에 둔다.
- `README.md` 를 쓴다(게임 소개·실행 방법·조작법·파일 구성, v2 부터는 새 기능 설명을 추가).
- v2·v3 는 **직전 라운드 결과물의 복사본**에서 시작한다(v2 는 자기 v1, v3 는 자기 v2). 기존 기능은 그대로 유지한다.
- **이전 라운드 채점에서 나온 결함·피드백은 모델에게 알려 주지 않는다.** 모델마다 매번 새 세션이라 아는 것은 지시문과 폴더 안의 코드뿐이다.

### 시험별 과제
- **01 테트리스** — v1: 아타리(Atari Games) 1988년 아케이드판 테트리스의 게임성과 그래픽을 최대한 가깝게 재현 → v2: 모바일 터치 조작 추가 → v3: 레벨·크레딧·컨티뉴 도입. 지시문 원문은 [01 README 3절](./01_tetris_game_test/#s3).
- **02 드래곤플라이트** — v1: 모바일 게임 「드래곤플라이트」의 게임성을 참고한 세로 스크롤 슈팅(원작의 그림·소리·이름은 복사하지 말고 직접 그리기, 서브에이전트 사용 허용) → v2: 터치 조작 추가(손가락을 끌어 좌우 이동) → v3: 스테이지·크레딧·컨티뉴 도입. 지시문 원문은 [02 README 3절](./02_dragonflight_game_test/#s3).
- **03 디펜스(준비 중)** — v1: 어떤 디펜스 게임으로 만들지(장르 해석·규칙·세계관·화면 구성·조작 방식)와 기획·디자인을 어떻게 진행할지를 모델에 맡김. 인터넷 검색, 외부 라이브러리·이미지·소리(출처·라이선스를 README.md 에 적기), 페르소나·서브에이전트 사용을 허용하고 **라운드당 15분** 안에 끝낸다. 시작·마감 시각을 알려 주며, 마감이 되면 작업을 강제로 끝내고 그 순간의 결과물로 평가한다 → v2: 모바일 터치 조작 추가 → v3: 스테이지 4개마다 보스전(예: 4·8·12 스테이지). 보스는 일반 적과 다른 체력과 행동 패턴을 갖고, 현재 스테이지와 보스전 여부를 화면에 표시한다. 지시문 원문은 [03 README 3절](./03_defense_game_test/#s3).

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
- [simple_llm_test_aw_dragonflight_v2](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_aw_dragonflight_v2/index.html)
- [simple_llm_test_bolt_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_bolt_dragonflight_v1/index.html)
- [simple_llm_test_bolt_dragonflight_v2](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_bolt_dragonflight_v2/index.html)
- [simple_llm_test_bolt_dragonflight_v3](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_bolt_dragonflight_v3/index.html)
- simple_llm_test_c1_dragonflight_v1 — 파일 없음
- simple_llm_test_c1_dragonflight_v2 — 파일 없음
- simple_llm_test_c7_dragonflight_v1 — 파일 없음
- simple_llm_test_c7_dragonflight_v2 — 파일 없음
- simple_llm_test_c7r_dragonflight_v1 — 파일 없음
- simple_llm_test_c7r_dragonflight_v2 — 파일 없음
- [simple_llm_test_cn_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_cn_dragonflight_v1/index.html)
- [simple_llm_test_cn_dragonflight_v2](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_cn_dragonflight_v2/index.html)
- [simple_llm_test_cn_dragonflight_v3](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_cn_dragonflight_v3/index.html)
- [simple_llm_test_ff_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_ff_dragonflight_v1/index.html)
- [simple_llm_test_ff_dragonflight_v2](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_ff_dragonflight_v2/index.html)
- [simple_llm_test_fn_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_fn_dragonflight_v1/index.html)
- [simple_llm_test_fn_dragonflight_v2](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_fn_dragonflight_v2/index.html)
- [simple_llm_test_lfm_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_lfm_dragonflight_v1/index.html)
- [simple_llm_test_lfm_dragonflight_v2](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_lfm_dragonflight_v2/index.html)
- [simple_llm_test_mcv_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_mcv_dragonflight_v1/index.html)
- [simple_llm_test_mcv_dragonflight_v2](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_mcv_dragonflight_v2/index.html)
- [simple_llm_test_mel_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_mel_dragonflight_v1/index.html)
- [simple_llm_test_mel_dragonflight_v2](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_mel_dragonflight_v2/index.html)
- [simple_llm_test_mg_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_mg_dragonflight_v1/index.html)
- [simple_llm_test_mg_dragonflight_v2](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_mg_dragonflight_v2/index.html)
- [simple_llm_test_mg_dragonflight_v3](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_mg_dragonflight_v3/index.html)
- [simple_llm_test_orn_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_orn_dragonflight_v1/index.html)
- [simple_llm_test_orn_dragonflight_v2](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_orn_dragonflight_v2/index.html)
- [simple_llm_test_orn_dragonflight_v3](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_orn_dragonflight_v3/index.html)
- [simple_llm_test_q36_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_q36_dragonflight_v1/index.html)
- [simple_llm_test_q36_dragonflight_v2](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_q36_dragonflight_v2/index.html)
- [simple_llm_test_q36_dragonflight_v3](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_q36_dragonflight_v3/index.html)
- [simple_llm_test_q38_dragonflight_v1](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_q38_dragonflight_v1/index.html)
- [simple_llm_test_q38_dragonflight_v2](https://genishs.github.io/llm_model_test/02_dragonflight_game_test/simple_llm_test_q38_dragonflight_v2/index.html)

### 03_defense_game_test

