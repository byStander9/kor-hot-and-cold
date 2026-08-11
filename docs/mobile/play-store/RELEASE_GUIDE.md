# Google Play 출시 가이드

이 문서는 `뜨겁고 차갑게` Android 앱을 Google Play에 올릴 때 코드에서 자동화한 범위와 운영자가 직접 완료할 단계를 구분합니다.

## 현재 출시 설정

| 항목 | 값 |
|---|---|
| Android package | `com.bystander9.korhotandcold` |
| 앱 버전 | `1.0.0` |
| Android versionCode | `1` |
| production 산출물 | Android App Bundle (`.aab`) |
| preview 산출물 | 설치 가능한 APK (`.apk`) |
| 앱 권한 | 인터넷, 진동 |

Google Play은 2021년 8월부터 신규 앱에 Android App Bundle을 요구합니다. EAS Build도 Android 스토어 빌드의 기본 형식으로 AAB를 사용합니다. APK는 Play 출시 파일이 아니라 실기기 직접 설치용 preview에 사용합니다.

- [Google Play의 Android App Bundle 안내](https://developer.android.com/guide/app-bundle)
- [Expo의 APK와 AAB 구분](https://docs.expo.dev/build-reference/apk/)

## 1. 빌드 전 운영 주소 확정

앱은 빌드 시 아래 공개 값을 번들에 포함합니다. `EXPO_PUBLIC_` 값은 비밀이 아니며 앱 사용자도 읽을 수 있습니다. 운영 HTTPS 주소가 확정되기 전 production AAB를 배포하지 않습니다.

```text
EXPO_PUBLIC_API_BASE_URL=https://<운영-api>
EXPO_PUBLIC_SHARE_BASE_URL=https://<공개-웹앱>
EXPO_PUBLIC_POLICY_BASE_URL=https://<운영-space>
```

`EXPO_PUBLIC_POLICY_BASE_URL`에는 `/privacy`와 `/licenses` 페이지가 있어야 합니다. EAS 프로젝트 생성 후 `production`과 `preview` 환경에 값을 등록합니다.
운영 API 컨테이너를 GHCR에 게시하고 호스팅에 연결하는 절차는 [GHCR 운영 이미지 배포 안내](../../DEPLOYMENT_GHCR.md)를 따릅니다.

```powershell
npx eas-cli env:create --environment production --visibility plaintext --name EXPO_PUBLIC_API_BASE_URL --value https://<운영-api>
npx eas-cli env:create --environment production --visibility plaintext --name EXPO_PUBLIC_SHARE_BASE_URL --value https://<공개-웹앱>
npx eas-cli env:create --environment production --visibility plaintext --name EXPO_PUBLIC_POLICY_BASE_URL --value https://<운영-space>
```

## 2. 로컬 검사

```powershell
cd apps/mobile
npm ci
npm test
npm run typecheck
npm run lint
npm run doctor
npm run export:android
```

Android Manifest 예상값은 다음 명령으로 확인합니다.

```powershell
npx expo config --type introspect --json
```

- package가 `com.bystander9.korhotandcold`인지 확인합니다.
- version이 `1.0.0`, versionCode가 `1`인지 확인합니다.
- `INTERNET`, `VIBRATE` 외에 앱 기능과 무관한 민감 권한이 추가되지 않았는지 확인합니다.
- 저장소 읽기·쓰기와 시스템 오버레이 권한에는 제거 지시가 있어야 합니다.

## 3. EAS 빌드

Expo 계정 로그인과 Android 서명 키는 운영자가 직접 준비합니다. 저장소에는 keystore, Expo token, Google Service Account JSON을 커밋하지 않습니다.

```powershell
npx eas-cli login
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production
```

- `preview`: 내부 공유용 APK
- `production`: Play 업로드용 AAB

첫 production 빌드에서는 EAS가 새 Android keystore를 안전하게 생성·관리하도록 선택하거나 기존 upload key를 제공합니다. 생성 뒤에는 같은 키를 계속 사용해야 업데이트가 가능합니다.

## 4. 로컬 AAB 대안

EAS local build는 Expo 인증이 필요하고 Windows를 공식 지원하지 않습니다. Windows에서는 WSL 또는 Android Studio/SDK가 준비된 환경을 사용합니다.

```powershell
npx eas-cli build --platform android --profile production --local
```

Continuous Native Generation으로 직접 빌드한다면 `npx expo prebuild --platform android` 후 Gradle `bundleRelease`를 실행합니다. 일반적인 결과 경로는 다음과 같지만 release signing 설정이 먼저 필요합니다.

```text
apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
```

[Expo local build 제한사항](https://docs.expo.dev/build-reference/local-builds/)을 먼저 확인합니다.

## 5. Play Console 첫 출시

1. Google Play 개발자 계정을 만들고 본인 인증을 완료합니다.
2. 새 앱을 만들 때 package를 `com.bystander9.korhotandcold`로 고정합니다. package는 이후 변경할 수 없습니다.
3. Play App Signing을 설정합니다.
4. 첫 AAB를 내부 테스트 트랙에 수동 업로드합니다.
5. 개인정보처리방침 URL, Data Safety, 앱 액세스, 광고 여부, 콘텐츠 등급, 대상 연령을 작성합니다.
6. [Play 스토어 그래픽 자산](../store-assets/README.md)의 아이콘·feature graphic과 최종 출시 빌드 스크린샷을 등록합니다.
7. 실기기 내부 테스트를 통과한 뒤 비공개 테스트와 production 순서로 진행합니다.

Play Console에 입력할 문안은 [한국어 스토어 등록정보 초안](STORE_LISTING_KO.md)에서 복사한 뒤 실제 출시 빌드와 일치하는지 다시 확인합니다.

EAS Submit 자동화에는 Google Service Account가 필요합니다. 자격증명이 없는 첫 출시는 Play Console에서 수동으로 진행하는 편이 단순합니다.

- [Expo Android 첫 수동 제출](https://docs.expo.dev/submit/android-manual/)
- [Expo EAS Submit](https://docs.expo.dev/submit/android/)

2023년 11월 13일 이후 만든 개인 개발자 계정은 production 권한 신청 전에 최소 12명이 14일 연속 참여한 비공개 테스트가 필요할 수 있습니다. 실제 계정 대시보드의 요구사항을 우선합니다.

- [Google Play 신규 개인 계정 테스트 요구사항](https://support.google.com/googleplay/android-developer/answer/14151465)

## 6. Data Safety와 개인정보

모든 앱은 Data Safety 양식을 작성해야 하며, 데이터를 수집하지 않는다고 판단하는 경우에도 개인정보처리방침 링크가 필요합니다. 이 앱은 다음 사실을 기준으로 운영 호스팅 확정 후 답변을 최종 검토합니다.

- 로그인, 광고, 분석 SDK, 푸시 알림이 없습니다.
- 시드별 진행 상태는 기기의 로컬 저장소에만 보관합니다.
- 시드, 추측어, 힌트·정답 공개 요청은 판정 서버로 전송됩니다.
- 판정 요청을 즉시 처리하고 별도 저장하지 않는다면 Google의 일시적 처리 기준을 검토할 수 있습니다.
- 호스팅 접근 로그에 IP, 요청 URL, 시각, User-Agent가 남는지와 보유기간을 운영 설정에서 확인해야 합니다.
- IP로 위치를 추론하거나 요청을 분석 용도로 재사용한다면 해당 데이터 유형과 목적을 신고해야 합니다.
- 전송 중 암호화 항목은 모든 운영 URL이 HTTPS일 때만 선택합니다.

[Google Play Data Safety 안내](https://support.google.com/googleplay/android-developer/answer/10787469)를 기준으로 실제 서버 동작과 일치시킵니다. Console 응답은 [Data safety 답변 초안](DATA_SAFETY_DRAFT_KO.md), 정책 문안은 [개인정보처리방침 초안](PRIVACY_POLICY_DRAFT_KO.md)을 사용하고, [Google Play 출시 요구사항 체크리스트](../GOOGLE_PLAY_RELEASE_CHECKLIST.md)와 함께 다시 확인합니다. 공개 연락처를 정하기 전에는 [개인정보 연락처 준비 메모](../PRIVACY_RELEASE_NOTE.md)도 확인합니다.

## 7. 업데이트 규칙

매 Play 업데이트마다 다음을 지킵니다.

1. 사용자에게 보이는 `expo.version`을 필요에 따라 올립니다.
2. `expo.android.versionCode`는 반드시 이전 업로드보다 큰 정수로 올립니다.
3. 같은 package와 같은 upload key를 사용합니다.
4. production 환경 주소, 정책, Data Safety 답변을 다시 확인합니다.
5. preview APK로 회귀 테스트한 뒤 production AAB를 만듭니다.
