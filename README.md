# llm_model_test — 로컬 LLM 15종 코딩 대회 (테트리스)

같은 지시문으로 로컬 LLM 15종에게 브라우저용 테트리스 게임을 만들게 하고, 실행 시험과 코드 리뷰로 1000점 만점 순위를 매긴다.

## 규칙
- 서버: AMD Strix Halo(Radeon 8060S, 통합 메모리 64GB) · llama.cpp b11701 router 모드 · 모델은 한 번에 하나.
- 에이전트: opencode v1.18.35 `opencode run --auto -m halo/<약어>` — 모델마다 새 세션, 같은 지시문(폴더 이름만 다름).
- 샌드박스(bubblewrap): 각 모델은 **자기 폴더만 쓸 수 있고** 다른 모델의 폴더·서버의 다른 파일은 보이지 않는다. 웹 접근 차단. 1회 최대 60분.
- 각 모델의 router 기본 설정 그대로(생각 모드·샘플링은 모델별 프리셋).

## 지시문
`simple_llm_test_<약어>_tetris_v1` 폴더 안에 —
- 아타리(Atari Games, 1988년 아케이드판) 테트리스의 게임성과 그래픽을 최대한 가깝게 재현
- 설치·빌드·서버 없이 `index.html` 을 브라우저로 열면 바로 실행
- 필요한 파일은 모두 이 폴더 안에
- 게임 소개·실행 방법·조작법·파일 구성을 담은 `README.md`

## 평가 (1000점)
1. 실행 시험 — 헤드리스 Chrome 으로 index.html 을 열고 시작·이동·회전·하드드롭·일시정지·재개·연속 플레이를 키 입력으로 시험, 오류와 화면 변화를 기록, 스크린샷 10장.
2. 코드 리뷰 — 기능 구현, 코드 간결성, 컴포넌트·모듈 분리, 패키지·의존성, 파일·경로 배분, 문서(README).
3. 그래픽·실행 감각은 사람이 직접 확인.

결과는 이 폴더에 `RESULTS.md` 로 정리한다.


## 바로 플레이

### 01_tetris_game_test

- [simple_llm_test_aw_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_aw_tetris_v1/index.html)
- [simple_llm_test_aw_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_aw_tetris_v2/index.html)
- [simple_llm_test_bolt_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_bolt_tetris_v1/index.html)
- [simple_llm_test_bolt_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_bolt_tetris_v2/index.html)
- [simple_llm_test_c1_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_c1_tetris_v1/)
- [simple_llm_test_c1_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_c1_tetris_v2/)
- [simple_llm_test_c7_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_c7_tetris_v1/)
- [simple_llm_test_c7_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_c7_tetris_v2/)
- [simple_llm_test_c7r_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_c7r_tetris_v1/)
- [simple_llm_test_c7r_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_c7r_tetris_v2/)
- [simple_llm_test_cn_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_cn_tetris_v1/index.html)
- [simple_llm_test_cn_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_cn_tetris_v2/index.html)
- [simple_llm_test_ff_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_ff_tetris_v1/index.html)
- [simple_llm_test_ff_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_ff_tetris_v2/index.html)
- [simple_llm_test_fn_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_fn_tetris_v1/)
- [simple_llm_test_fn_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_fn_tetris_v2/index.html)
- [simple_llm_test_lfm_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_lfm_tetris_v1/index.html)
- [simple_llm_test_lfm_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_lfm_tetris_v2/index.html)
- [simple_llm_test_mcv_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mcv_tetris_v1/index.html)
- [simple_llm_test_mcv_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mcv_tetris_v2/index.html)
- [simple_llm_test_mel_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mel_tetris_v1/index.html)
- [simple_llm_test_mel_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mel_tetris_v2/index.html)
- [simple_llm_test_mg_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mg_tetris_v1/index.html)
- [simple_llm_test_mg_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_mg_tetris_v2/index.html)
- [simple_llm_test_orn_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_orn_tetris_v1/index.html)
- [simple_llm_test_orn_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_orn_tetris_v2/index.html)
- [simple_llm_test_q36_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_q36_tetris_v1/index.html)
- [simple_llm_test_q36_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_q36_tetris_v2/index.html)
- [simple_llm_test_q38_tetris_v1](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_q38_tetris_v1/index.html)
- [simple_llm_test_q38_tetris_v2](https://genishs.github.io/llm_model_test/01_tetris_game_test/simple_llm_test_q38_tetris_v2/index.html)

### 02_dragonflight_game_test

