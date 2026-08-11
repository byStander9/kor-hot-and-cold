---
title: Korean Hot and Cold API
emoji: 🌡️
colorFrom: blue
colorTo: red
sdk: docker
app_port: 7860
license: mit
---

# 한국어 Hot and Cold API

공개 한국어 사전과 `intfloat/multilingual-e5-small`로 미리 계산한 임베딩을 이용해 시드 기반 한국어 의미 탐색 게임을 제공합니다.

- 웹 게임: 이 Space의 App 탭
- 상태 확인: `/api/health`
- 게임 메타데이터: `/api/game?seed=123&v=1`
- 소스·문서: [GitHub 저장소](https://github.com/byStander9/kor-hot-and-cold)
- 개인정보처리방침: `/privacy`
- 데이터·오픈소스 출처: `/licenses`

## 운영 한계

이 서비스는 Hugging Face의 기본 CPU Space에서 운영하는 공개 데모입니다. 기본 CPU Space는 48시간 동안 사용되지 않으면 잠들 수 있으며, 다음 방문 때 자동으로 다시 시작됩니다. 따라서 절전 후 첫 요청은 평소보다 오래 걸리거나 준비 중 응답을 받을 수 있고, 24시간 무중단 운영이나 상용 SLA를 보장하지 않습니다.

게임 데이터와 코드가 컨테이너 이미지에 포함되며, 게임 진행 기록을 서버 데이터베이스에 저장하지 않습니다. 컨테이너의 임시 파일 시스템은 재시작 시 초기화됩니다.
