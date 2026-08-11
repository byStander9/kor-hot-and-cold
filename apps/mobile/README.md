# 뜨겁고 차갑게 모바일 앱

한국어 의미 순위 게임의 Expo/React Native 앱입니다. 첫 MVP는 Android와 Expo Go를 우선 지원하며 게임 데이터와 정답 판정은 기존 Next.js API 서버에서 처리합니다.

## 개발 실행

1. 의존성을 설치합니다.

   ```powershell
   npm install
   ```

2. `.env.example`을 `.env`로 복사하고 API 주소를 설정합니다. 실제 스마트폰에서는 `localhost`가 아니라 개발 PC의 같은 Wi-Fi IPv4 주소를 사용해야 합니다.

   ```dotenv
   EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:3000
   ```

3. Expo 개발 서버를 실행하고 Expo Go로 QR 코드를 엽니다.

   ```powershell
   npm start
   ```

## 검사

```powershell
npm run typecheck
npm run lint
npx expo-doctor
npm run export:android
```

API 주소는 공개 클라이언트 번들에 포함되므로 `EXPO_PUBLIC_` 환경 변수에 비밀 값이나 인증 키를 넣지 않습니다.
