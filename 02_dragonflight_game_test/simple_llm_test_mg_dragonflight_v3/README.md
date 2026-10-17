# Dragonflight - 세로 스크롤 슈팅

브라우저에서 바로 실행되는 HTML 기반 세로 스크롤 슈팅 게임입니다. 모바일 게임 드래곤플라이트의 게임성을 참고했으며, 모든 그래픽은 직접 그려진 Canvas 렌더링입니다.

## 게임 소개
- 플레이어 용은 화면 하단에서 좌우로 이동, 공격은 자동 발사
- 적 용은 가로 웨이브로 위에서 내려옴, 체력 보유, 접촉 시 게임 오버
- 쓰러진 적에서 코인 드롭, 가끔 공격 강화/자석/방어막 아이템 등장
- 운석 낙하 전 경고 표시
- 일정 거리마다 보스 등장, 속도·체력 상승

## 스테이지 규칙
- 보스 처치 시 Stage가 1씩 증가합니다.
- Stage 증가 시 적 HP와 보스 HP가 상승하고 난이도가 올라갑니다.
- 현재 Stage는 HUD의 Stage 표시와 게임 오버 화면에 표시됩니다.
- Continue를 사용하면 Score, Distance, Coins, Kills, Stage가 유지됩니다.

## 크레딧 / 컨티뉴
- Arcade 스타일 크레딧 시스템이 적용되었습니다.
- Credits는 게임 시작권이며, Coins는 게임 중 수집하는 아이템입니다.
- 크레딧 삽입 방법:
  - 타이틀 화면의 Coin Insert 버튼 터치
  - 키보드 Enter 또는 1 키 입력
- 게임 시작 시 1 Credits가 차감됩니다. Credits가 0이면 시작 불가.
- HUD에 Credits 잔여량이 표시됩니다.
- 게임 오버 시 10초 카운트다운 동안 Continue 가능.
- Continue는 1 Credits 소비, Score/Stage 유지.
- 카운트다운 만료 또는 Credits 부족 시 Title 화면으로 복귀.

## 게임 플로우
title(대기) → start → play → game over → continue → title

## 실행 방법
1. 이 폴더의 `index.html` 파일을 더블클릭하거나 브라우저에서 열기
2. 별도 설치·서버 불필요
3. Coin Insert로 Credits 삽입 후 시작 버튼 클릭

## 조작법
- 좌우 이동: ← / → 키 또는 A / D 키
- 마우스 이동: 마우스 커서 위치로 플레이어 이동
- 터치 조작: 화면을 손가락으로 좌우 드래그하여 플레이어 이동
- 공격: 자동
- 크레딧 삽입: 타이틀 화면에서 Enter / 1 키 또는 Coin Insert 버튼 터치

## 파일 구성
- `index.html` : 게임 전체 코드 (HTML/CSS/JS 단일 파일)
- `README.md` : 본 문서

## 점수
- 날아간 거리 + 처치 수 기반
- HUD에 Score / Distance / Coins / Kills / Stage / Credits 표시
- 게임 오버 시 Continue 또는 Title 복귀 가능
