# 모바일 앱 아이콘 자산

기본 Expo 로고를 대체하는 `뜨겁고 차갑게` 모바일 앱 아이콘 세트입니다. 크림색 바탕과 cold 파랑→warm 주황→hot 빨강 온도계를 사용하며, 글자 없이 작은 런처 아이콘에서도 읽히도록 제작했습니다.

## 파일 매핑

아래 파일을 `apps/mobile/assets/images/`의 같은 이름 파일로 복사합니다.

| 파일 | 크기 | 용도 |
|---|---:|---|
| `icon.png` | 1024×1024 | Expo 앱 아이콘 |
| `android-icon-foreground.png` | 1024×1024, 투명 | Android adaptive icon 전경 |
| `android-icon-background.png` | 1024×1024 | Android adaptive icon 크림색 배경 |
| `android-icon-monochrome.png` | 1024×1024, 투명 | Android 테마 아이콘 마스크 |
| `splash-icon.png` | 1024×1024, 투명 | 스플래시 중앙 심볼 |
| `favicon.png` | 64×64 | Expo web 파비콘 |

## 제작 정보

- 기본 이미지: OpenAI 내장 이미지 생성 도구
- 후처리: 크로마키 제거, 1024px 리사이즈, 단색 배경 합성, 알파 마스크 기반 monochrome 파생
- 배경: `#F5F2EB`
- 심볼 주요색: `#2376D2`, `#ED8A21`, `#E2442F`, `#17191F`

최종 생성 프롬프트 요약:

> 크림색 배경 중앙에 하나의 세로 온도계를 배치한다. 아래는 cold 파랑, 중앙은 warm 주황, 위는 hot 빨강이며 얇은 잉크 외곽선을 사용한다. circle, squircle, rounded-square 마스크에서 잘리지 않도록 충분한 안전 여백을 두고 글자, 숫자, 불꽃, 눈송이, 그림자, 테두리, 워터마크는 넣지 않는다.
