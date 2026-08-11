# Play Store 그래픽 자산

Google Play 등록 화면에 업로드할 그래픽과 검수용 초안을 모아 둡니다.

## 등록용 아이콘

- `play-store-icon-512.png`: 기존 앱 아이콘을 Lanczos 방식으로 정확히 512×512로 축소한 RGB 불투명 PNG입니다.
- 기준 원본: `docs/mobile/assets/icon.png`

## Feature graphic

- `feature-graphic-1024x500.png`: Play Store용 1024×500 RGB 불투명 PNG입니다.
- OpenAI 내장 ImageGen에 기존 `icon.png`를 reference로 제공해 온도계 실루엣과 cold blue→warm orange→hot red 색 순서를 유지했습니다.
- 생성본을 중앙 기준으로 1024:500 비율로 자른 뒤 Lanczos 방식으로 정확히 1024×500으로 변환했습니다.
- 크림색 바탕과 기존 브랜드 색만 사용하며 텍스트, 숫자, 추가 아이콘, 테두리, 워터마크는 포함하지 않습니다.

## 제출 전 확인

- 모든 최종 그래픽에서 글자·주요 심볼이 잘리지 않는지 Play Console 미리보기로 확인합니다.
- 스크린샷의 기기 프레임, 상태 표시줄, 앱 화면은 실제 출시 빌드와 일치해야 합니다.
