# Google Play 출시 체크리스트 초안

확인일: 2026년 8월 11일
범위: Android 휴대전화용 신규 게임 앱, 한국 출시 우선
출처 원칙: Google Play Console, Android Developers, Expo의 공식 문서만 사용

> Play 정책과 Console 질문은 자주 바뀝니다. 특히 목표 API와 본인확인·테스트 기준은 실제 제출 직전에 아래 공식 링크와 Play Console의 경고를 다시 확인해야 합니다. 이 문서는 법률 자문이 아닙니다.

## 현재 프로젝트 판단 요약

- 신규 앱은 APK가 아니라 **Android App Bundle(AAB)** 로 제출한다. APK는 로컬·내부 설치 테스트에만 사용한다.
- 2026년 8월 30일까지 신규 앱 제출 최소 목표는 API 35이고, **2026년 8월 31일부터 API 36**이다. 현재 Expo SDK 54는 Android `compileSdkVersion`과 `targetSdkVersion` 36을 사용하므로 방향이 맞지만 최종 AAB의 manifest를 확인한다.
- 앱은 로그인, 광고, 분석 SDK, 푸시 알림이 없고 진행 기록은 기기에 저장한다. 다만 추측어·시드가 API로 전송되고 호스팅 인프라가 IP 등 접속 정보를 처리할 수 있으므로 Data safety에서 무조건 “수집 없음”으로 답하지 않는다.
- 공개 개인정보처리방침은 운영 웹의 `/privacy`, 데이터·오픈소스 고지는 `/licenses`를 사용한다. Play 제출 시 URL이 인증 없이 열리는지 다시 확인한다.
- 한국어 단어 게임은 현재 도박·확률형 유료 아이템·위치정보가 없다. 이 상태가 유지되고 19세 이상 부적합 콘텐츠가 아니라면 Google 안내상 별도 GRAC 인증 조치는 요구되지 않지만, IARC 설문에는 실제 콘텐츠를 정확히 답한다.

## 1. 빌드 형식, API, 버전

### 코드에서 준비할 항목

- [ ] `android.package`를 확정한다. 최초 Play 업로드 뒤 패키지 이름은 앱의 영구 식별자가 되므로 변경하지 않는다.
- [ ] `android.versionCode`를 1 이상의 정수로 시작하고 매 출시마다 증가시킨다.
- [ ] Expo SDK 54의 Android target API 36을 유지하고 `npx expo-doctor`, 타입 검사, Android export를 통과시킨다.
- [ ] EAS production 프로필로 서명된 `.aab`를 생성한다.
- [ ] 실제 AAB의 target SDK, version code, 패키지명과 필요 권한을 Play Console의 App bundle explorer에서 확인한다.
- [ ] 인터넷 이외 불필요한 민감 권한이 없는지 검토한다.

### 사용자가 직접 할 항목

- [ ] Play Console에서 앱을 만들고 기본 언어를 한국어, 앱 유형을 게임, 무료/유료 여부를 결정한다.
- [ ] production 또는 테스트 트랙에 AAB를 업로드한다. APK를 신규 앱의 production 제출물로 쓰지 않는다.
- [ ] 제출 시점 목표 API 정책을 다시 확인한다. 2026년 8월 31일 이후 제출은 API 36 이상이 필요하다.

공식 근거:

- [Android App Bundle 안내와 신규 앱 AAB 요구](https://developer.android.com/guide/app-bundle)
- [App Bundle FAQ](https://developer.android.com/guide/app-bundle/faq)
- [Google Play 목표 API 요구사항](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en-GB_ALL)
- [Expo SDK 54 버전 문서](https://docs.expo.dev/versions/v54.0.0/)
- [EAS Android production build](https://docs.expo.dev/tutorial/eas/android-production-build/)

## 2. 앱 서명과 Play App Signing

### 코드·빌드에서 준비할 항목

- [ ] EAS credentials에 Android upload key를 안전하게 생성·보관한다.
- [ ] 키, 서비스 계정 JSON, 인증 토큰은 Git에 커밋하지 않는다.
- [ ] Play App Signing 등록 후에도 후속 업데이트는 같은 앱의 upload key로 서명한다.

### 사용자가 직접 할 항목

- [ ] 첫 AAB 업로드 과정에서 Play App Signing 약관과 키 설정을 확인한다.
- [ ] Google이 보관하는 app signing key와 개발자가 보관하는 upload key의 역할 차이를 확인한다.
- [ ] EAS Submit 자동화를 쓸 경우 Play Console에서 Google Service Account를 만들고 최소 권한을 부여한다. 최초 업로드는 Play Console에서 수동으로 해야 할 수 있다.

공식 근거:

- [Android 앱 서명과 Play App Signing](https://developer.android.com/studio/publish/app-signing)
- [EAS Submit for Android](https://docs.expo.dev/submit/android/)

## 3. 개발자 계정과 신규 개인 계정 테스트

### 사용자가 직접 해야 하는 항목

- [ ] Google Play 개발자 계정을 만들고 **미화 25달러 1회 등록비**를 결제한다.
- [ ] 개인 또는 조직 계정 유형을 실제 법적 상태에 맞게 선택하고 신원·연락처를 검증한다.
- [ ] 신규 개인 계정이면 Play Console 모바일 앱을 사용해 Android 10 이상, 루팅되지 않은 실물 Android 기기의 소유를 검증한다.
- [ ] 2023년 11월 13일 이후 생성한 개인 개발자 계정이면 production 신청 전에 closed test를 **최소 12명**이 **연속 14일** opt-in 상태로 유지한다.
- [ ] 테스트 후 production access 신청 설문에서 테스트 과정, 참여와 피드백, 앱의 준비 상태를 사실대로 작성한다.
- [ ] 2026년 9월 30일부터 시작되는 Android developer verification과 신규 앱 패키지 등록 적용 여부를 제출 시점에 다시 확인한다.

공식 근거:

- [Play Console 개발자 계정 생성과 등록비](https://support.google.com/googleplay/android-developer/answer/14659200?hl=en)
- [개발자 계정 등록비·결제 문제](https://support.google.com/googleplay/android-developer/answer/9875040?hl=en)
- [개발자 계정 정보 요구사항](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en)
- [신규 계정 기기 검증](https://support.google.com/googleplay/android-developer/answer/14316361?hl=en)
- [신규 개인 계정 앱 테스트 요구](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Android developer verification 개요](https://support.google.com/googleplay/android-developer/answer/10788890?hl=en)
- [Android 앱 등록 요구사항](https://support.google.com/googleplay/android-developer/answer/16984799?hl=en)

## 4. App content와 개인정보

### 코드와 문서에서 준비할 항목

- [x] 인증 없이 공개되는 `/privacy` 개인정보처리방침을 제공한다.
- [x] `/licenses`에서 데이터·모델·주요 오픈소스의 출처와 라이선스를 고지한다.
- [ ] Play 공개 연락 이메일이 정해지면 웹 방침의 문의처와 스토어 연락처를 일치시킨다.
- [ ] 최종 AAB의 SDK와 네트워크 호출을 다시 조사해 Data safety 응답과 실제 동작이 같은지 확인한다.

### Play Console에서 사용자가 직접 답할 항목

- [ ] **Data safety:** 추측어는 `Other user-generated content`에 해당할 가능성이 높고 게임 기능 제공 목적으로 서버에 전송된다. 서버가 영구 저장하지 않는다면 `ephemeral processing` 안내에 따라 답하되, 임시 처리도 설문에서 공개해야 할 수 있다.
- [ ] **Data safety:** Hugging Face 호스팅이 처리할 수 있는 IP·기기/브라우저 정보를 `Device or other IDs` 등 어떤 유형으로 신고해야 하는지 최종 데이터 흐름과 Console 정의를 대조한다.
- [ ] **Privacy policy:** 공개 HTTPS `/privacy` URL을 등록한다. 로그인·지역 제한·편집 권한이 필요하거나 PDF인 URL은 사용하지 않는다.
- [ ] **Ads:** 현재 광고가 없으므로 `No`로 선언한다. 광고 SDK를 추가하면 즉시 수정한다.
- [ ] **App access:** 로그인이나 멤버십 제한이 없으므로 모든 기능이 제한 없이 접근 가능하다고 답한다. 나중에 제한 기능이 생기면 검토용 계정·절차를 제공한다.
- [ ] **Content rating:** IARC 설문을 실제 단어 콘텐츠와 상호작용 기준으로 제출한다. 미등급 상태로 두지 않는다.
- [ ] **Target audience:** 실제 마케팅 대상 연령을 선택한다. 13세 미만을 대상으로 선택하면 Families 정책이 추가 적용되므로 단순히 노출 범위를 넓히려고 선택하지 않는다.
- [ ] 앱 분류, 뉴스, 금융, 건강, 정부 관련 등 Console에 나타나는 추가 선언도 실제 기능에 맞게 완료한다.

공식 근거:

- [개인정보처리방침 요구사항](https://support.google.com/googleplay/android-developer/answer/17105854)
- [사용자 데이터 정책](https://support.google.com/googleplay/android-developer/answer/10144311)
- [Data safety 작성 안내와 ephemeral processing](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [App content: 개인정보, 광고, 앱 접근 등](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en-EN)
- [Target audience와 콘텐츠](https://support.google.com/googleplay/android-developer/answer/9867159/manage-target-audience-and-app-content-settings?hl=en-GB)
- [콘텐츠 등급 요구사항](https://support.google.com/googleplay/android-developer/answer/9898843?hl=en)
- [콘텐츠 등급 설문 작성](https://support.google.com/googleplay/android-developer/answer/9859655?hl=en_EN)
- [앱 권한 선언](https://support.google.com/googleplay/android-developer/answer/9214102?hl=en)

## 5. 스토어 등록정보와 그래픽

### 텍스트 준비

- [ ] 앱 이름: 최대 30자.
- [ ] 짧은 설명: 최대 80자.
- [ ] 전체 설명: 최대 4,000자.
- [ ] 한국어 기본 등록정보를 먼저 작성하고 실제 지원 언어만 번역한다.
- [ ] “1위”, 가격, 프로모션, 다른 앱과의 비교처럼 오해를 부르는 메타데이터를 피한다.
- [ ] 지원 이메일을 반드시 등록하고, 웹사이트 URL도 가능하면 등록한다.

### 그래픽 준비

- [ ] Play 스토어 아이콘: 32-bit PNG(알파), 512×512px, 최대 1,024KB.
- [ ] Feature graphic: JPEG 또는 24-bit PNG(알파 없음), 1,024×500px.
- [ ] 스크린샷: 기기 유형별 최소 2장, 최대 8장. 한 변 최소 320px, 최대 3,840px이며 긴 변은 짧은 변의 2배를 넘지 않는다.
- [ ] 게임 추천 노출을 위해 휴대전화 스크린샷은 실제 게임 화면을 담은 최소 3장, 1,080px 이상, 9:16 세로 또는 16:9 가로 구성을 우선한다.
- [ ] 360px과 430px 폭의 실기기에서 시작, 추측, 힌트, 완료, 전체 순위, 오류·재시도 상태를 캡처한다.
- [ ] 기기 프레임·텍스트를 과도하게 넣지 말고 실제 UI와 다른 기능을 암시하지 않는다.

공식 근거:

- [스토어 등록정보 텍스트 작성](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en-EN)
- [미리보기 그래픽 규격](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en-GB)
- [Google Play 앱 아이콘 사양](https://developer.android.com/distribute/google-play/resources/icon-design-specifications)

## 6. 한국 출시 확인

### 사용자가 직접 할 항목

- [ ] 한국 개발자의 새 개인 계정은 개발자 전화번호를 제공·검증하며 Google Play에 표시될 수 있음을 확인한다.
- [ ] 계정 생성일과 개인/사업자 여부에 맞는 추가 연락처를 Play Console에 입력한다. 기존 개인 계정은 전화번호, 사업자는 주소와 전화번호 요구가 안내되어 있다.
- [ ] 유료 앱 또는 인앱 결제를 도입하는 경우 사업자등록번호, 통신판매업 신고번호, 발급 기관명 등 한국 추가 항목을 다시 확인한다. 현재 무료·무결제 MVP에는 적용 범위가 다르다.
- [ ] 실제 콘텐츠가 19세 미만 부적합, 모의 도박 또는 확률형 유료 아이템을 포함하지 않는지 확인한다. 그런 기능이 추가되면 GRAC와 확률 공개 요구를 별도로 검토한다.
- [ ] 위치정보를 수집하지 않는 현재 권한·기능을 유지한다. 위치 기능을 추가하면 한국 위치정보 규제를 별도로 검토한다.

공식 근거:

- [국가·지역별 배포 요구사항: 한국](https://support.google.com/googleplay/android-developer/answer/6223646?hl=en)

## 7. 제출 흐름

1. 패키지명, 버전, 아이콘·스플래시, 운영 API URL과 개인정보처리방침을 확정한다.
2. 테스트와 Expo Doctor를 통과하고 EAS production AAB를 만든다.
3. Play Console 앱을 생성하고 Play App Signing을 설정한 뒤 내부 테스트에 AAB를 업로드한다.
4. App content의 Data safety, 개인정보처리방침, 광고, 앱 접근, 대상 연령, 콘텐츠 등급과 추가 선언을 완료한다.
5. 한국어 스토어 텍스트, 아이콘, feature graphic, 스크린샷과 지원 연락처를 등록한다.
6. Android 실기기에서 내부 테스트하고 오류·네트워크 절전 복구·한국어 IME·접근성을 확인한다.
7. 신규 개인 계정이면 12명/14일 closed test와 production access 신청을 완료한다.
8. pre-review checks와 정책 경고를 해결하고 production release를 만든다.
9. 국가/지역에 한국을 포함하고, 검토 제출 및 managed publishing 여부를 확인한다.
10. 승인 후 crash/ANR, 사용자 피드백, API 가용성과 정책 변경을 모니터링한다.

공식 근거:

- [앱 만들기와 설정](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en)
- [릴리스 준비와 출시](https://support.google.com/googleplay/android-developer/answer/9859348?hl=en)
- [앱 게시](https://support.google.com/googleplay/android-developer/answer/9859751?hl=en)

## 코드에서 완료 가능한 일과 계정 소유자만 가능한 일

| Codex가 코드에서 준비 가능 | 사용자가 계정에서 직접 수행 |
|---|---|
| 패키지명·versionCode·권한 설정 | 개발자 계정 생성, 등록비와 신원 검증 |
| EAS build/submit 설정과 AAB 생성 절차 | Play App Signing 약관·키 선택 확인 |
| 개인정보·출처 페이지와 운영 URL | Data safety/IARC/대상 연령의 법적 선언 |
| 스토어 텍스트·그래픽 초안과 규격 검사 | 공개 이메일·전화번호·사업자 정보 입력 |
| 자동 테스트, Expo Doctor, 실기기 체크리스트 | 12명/14일 closed test 참여자 모집·운영 |
| 릴리스 노트와 제출용 문서 | 국가 선택, 검토 제출, production 공개 승인 |

## 제출 직전 변동 재확인 항목

- 목표 API 전환일과 연장 정책
- 개인 계정 closed test의 인원·기간·production access 기준
- Android developer verification과 앱 패키지 등록 일정
- Data safety 질문·데이터 유형 정의
- 스토어 그래픽 권장 규격과 프로모션 자격
- 한국 개발자 공개 연락처와 유료 게임 관련 규정
