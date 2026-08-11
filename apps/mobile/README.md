# 뜨겁고 차갑게 모바일 앱

한국어 의미 순위 게임의 Expo/React Native 앱입니다. 첫 MVP는 Android와 Expo Go를 우선 지원하며 게임 데이터와 정답 판정은 기존 Next.js API 서버에서 처리합니다.

## 스마트폰에서 개발 실행

1. PC와 Android 스마트폰을 같은 Wi-Fi에 연결하고 `ipconfig`에서 PC의 Wi-Fi IPv4 주소를 확인합니다.

2. 별도 PowerShell 창에서 API 서버를 LAN에 공개합니다.

   ```powershell
   cd ../web
   npm install
   npm run dev -- --hostname 0.0.0.0
   ```

3. 모바일 의존성과 환경 파일을 준비합니다.

   ```powershell
   cd ../mobile
   npm install
   Copy-Item .env.example .env.local
   ```

4. `.env.local`의 예시 주소를 실제 PC IPv4 주소로 바꿉니다. 이 파일은 Git에서 무시되므로 PC별 LAN 주소가 커밋되지 않습니다.

   ```dotenv
   EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:3000
   EXPO_PUBLIC_SHARE_BASE_URL=http://192.168.0.10:3000
   ```

5. Expo 개발 서버를 실행하고 Android의 Expo Go로 QR 코드를 엽니다.

   ```powershell
   npm start -- --lan
   ```

스마트폰에서는 `localhost`나 `127.0.0.1`이 PC를 가리키지 않습니다. 연결되지 않으면 두 기기가 같은 Wi-Fi인지, Windows 방화벽에서 개인 네트워크의 Node.js 접근을 허용했는지, API 주소의 IPv4가 현재 PC 주소와 같은지 확인합니다.

배포 환경에서는 `EXPO_PUBLIC_SHARE_BASE_URL`을 친구가 열 수 있는 공개 HTTPS 웹앱 주소로 바꿉니다. `EXPO_PUBLIC_` 값은 앱 번들에서 읽을 수 있으므로 비밀 키를 넣지 않습니다.

## 검사

```powershell
npm test
npm run typecheck
npm run lint
npm run doctor
npm run export:android
```

## 저장과 개인정보

- 로그인, 광고, 분석 SDK, 푸시 알림을 사용하지 않습니다.
- 시드별 추측·힌트·종료 상태만 기기의 AsyncStorage에 저장합니다.
- 정답 판정과 순위 계산은 API 서버에서 처리하며 28만 단어 사전과 임베딩은 앱에 포함하지 않습니다.
- 앱과 Play 스토어의 데이터 보안 답변은 실제 운영 서버 로그·호스팅 설정이 확정된 뒤 다시 검토해야 합니다.

## 데이터와 라이선스

게임 서버는 공개 한국어 사전, `intfloat/multilingual-e5-small`, Kiwi로 만든 데이터를 사용합니다. 모바일 앱이 원본 데이터를 번들하지 않더라도 Play 배포 전 앱 내 출처 안내와 스토어 설명에 저작자와 라이선스를 고지해야 합니다. 고정 리비전과 재배포 조건은 저장소의 [`docs/DATA_SOURCES.md`](../../docs/DATA_SOURCES.md)와 [`data/sources/data_sources.yml`](../../data/sources/data_sources.yml)을 따릅니다.

실기기 검증 절차는 [`docs/mobile/ANDROID_TEST_CHECKLIST.md`](../../docs/mobile/ANDROID_TEST_CHECKLIST.md)에 있습니다.
