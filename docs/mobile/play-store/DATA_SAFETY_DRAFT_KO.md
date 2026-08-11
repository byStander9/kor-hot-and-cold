# Google Play Data safety 답변 초안

작성일: 2026년 8월 11일  
상태: 운영 호스트 확정 전 보수적 초안

> 이 문서를 그대로 제출하지 마세요. Data safety 답변은 최종 AAB, 운영 API, 호스팅 로그와 Play Console에 표시되는 최신 질문을 기준으로 사용자가 직접 확인·제출해야 합니다. 임시 처리도 Google의 정의상 “수집” 답변이 필요할 수 있습니다.

## 현재 확인된 앱 동작

- 회원가입·로그인과 앱 자체 사용자 계정이 없다.
- 광고, 광고 ID 사용, 이용자 분석 SDK, 푸시 알림, 위치 권한이 없다.
- 시드별 게임 진행은 React Native AsyncStorage를 통해 이용자 기기에만 저장된다.
- 시드, 게임 데이터 버전, 추측어, 현재 최고 순위, 순위표 조회 범위가 HTTPS API로 전송될 예정이다.
- 서버 코드는 추측어나 플레이 기록을 별도 데이터베이스·파일에 저장하지 않는다.
- 서버 메모리 캐시는 시드별 공개 어휘 순위 계산 결과만 보관하며 이용자의 추측 기록을 보관하지 않는다.
- Expo Go와 개발 서버는 개발용이며 Play production AAB의 데이터 흐름으로 간주하지 않는다.
- 운영 후보인 Hugging Face Docker Space는 PRO 구독 요구로 생성되지 않았고, Vercel은 인증이 확인되지 않아 배포되지 않았다. 따라서 현재 운영 호스트와 공개 API URL은 미확정이다.

## 보수적 Data safety 답변 초안

### 앱이 사용자 데이터를 수집하거나 공유하는가?

초안: **수집함(Yes)**, **제3자 공유는 최종 호스트 계약 확인 전 미확정**.

추측어가 기기 밖의 서버로 전송되므로 영구 저장하지 않더라도 “수집하지 않음”으로 단정하지 않습니다. 호스팅 사업자가 서비스 제공자로만 처리하는 전송은 Google의 `sharing` 예외에 해당할 수 있지만, 최종 사업자·약관·로그 설정을 확인한 뒤 결정합니다.

### 확정적으로 신고할 가능성이 높은 데이터

| Google Play 데이터 범주 후보 | 실제 값 | 수집 | 공유 | 목적 | 처리 방식 |
|---|---|---:|---:|---|---|
| User-generated content → Other user-generated content | 이용자가 입력한 한국어 추측어 | 예 | 미확정 | App functionality | 요청 판정 후 앱 서버는 영구 저장하지 않는 임시 처리 |

추측어는 자유 입력이므로 이용자가 이름·연락처 같은 개인정보를 입력할 가능성을 완전히 막을 수 없습니다. 앱과 개인정보처리방침에서 개인정보를 입력하지 말라고 안내합니다.

### 운영 호스트 확정 뒤 판단할 데이터

| 데이터 범주 후보 | 발생 가능성 | 확인할 내용 |
|---|---|---|
| Device or other IDs | 호스트가 IP 주소·요청 식별자를 access log에 남길 수 있음 | IP가 최신 Console 분류에서 어느 유형인지, 로그 기본값·보관 기간·비활성화 가능 여부 |
| Approximate location | 호스트가 IP에서 대략적 위치를 추론할 수 있음 | 실제 추론 여부와 정책·로그 필드 |
| App interactions | API 경로, 요청 시각, 응답 코드가 로그에 남을 수 있음 | 로그가 개별 이용자나 식별자와 연결되는지 |
| Diagnostics | 호스트·앱 crash/error 로그가 생길 수 있음 | production AAB에 진단 SDK가 있는지, 서버 오류 본문에 추측어가 기록되는지 |

이 표의 항목은 “반드시 수집한다”는 선언이 아니라 최종 운영 검증 목록입니다. 확인 전 임의로 `No`를 선택하지 않습니다.

## 현재 수집하지 않는 것으로 확인된 범주

- 이름, 이메일, 전화번호, 주소 등 Personal info
- 결제 정보와 구매 기록
- 정밀·대략 위치 권한을 통한 위치정보
- 연락처, 사진, 동영상, 오디오, 파일·문서
- 건강·피트니스 정보
- 메시지, 이메일, SMS
- 웹 탐색 기록
- 광고 ID 기반 광고·마케팅 데이터

단, 최종 의존성 조사와 호스트 로그 검토에서 다른 흐름이 발견되면 이 목록을 수정합니다.

## 수집 목적 초안

- 추측어: `App functionality`만 선택
- 시드·게임 버전·최고 순위·페이지 범위: 게임 응답 생성에 필요한 기능 매개변수이며 개인과 연결해 저장하지 않음
- 광고·마케팅, 분석, 개인화, 계정 관리, 사기 방지 목적: 현재 앱 자체에는 해당 없음

## 처리·보안 질문 초안

- 전송 중 암호화: 운영 API가 유효한 공개 HTTPS로 확정되고 HTTP fallback이 없는 것을 확인한 뒤 **Yes**
- 데이터 삭제 요청: 앱 자체 서버 계정이나 영구 플레이 데이터가 없어 서버에서 삭제할 계정 데이터는 없음. 기기 진행 기록은 Android 앱 데이터 삭제 또는 앱 제거로 삭제 가능
- 계정 삭제 URL: 앱에서 계정을 만들 수 없으므로 계정 삭제 정책의 적용 대상이 아님. 향후 계정을 추가하면 앱 내부와 웹에서 삭제 경로를 함께 제공
- 독립 보안 검토: 실제 인증·심사를 받지 않았으므로 관련 배지나 검증을 주장하지 않음
- 아동·가족 관련 약속: 초기 권고 대상은 13세 이상이며, 13세 미만을 대상으로 선택하지 않음. 최종 Target audience 선택과 일치시킴

## 호스트 확정 후 필수 검증

- [ ] production API 기본 URL과 운영 사업자 확정
- [ ] 유효한 HTTPS와 인증서, HTTP 차단 확인
- [ ] 호스트 개인정보처리방침·subprocessor·처리 지역 링크 기록
- [ ] access/runtime/build log의 필드, 기본 보관 기간, 검색 권한, 삭제·비활성화 옵션 확인
- [ ] 요청 본문과 query string에 추측어가 로그로 남는지 실제 요청으로 확인
- [ ] IP, User-Agent, request ID, 대략적 위치, 오류 stack의 수집 여부 확인
- [ ] 호스트가 Google 정의의 service provider에 해당하는지 약관을 검토해 `shared` 여부 결정
- [ ] 최종 AAB의 네트워크 트래픽을 캡처해 문서화되지 않은 endpoint가 없는지 확인
- [ ] `package-lock.json`과 Android manifest에서 analytics, ads, crash reporting, location, advertising ID SDK·권한 재검사
- [ ] Play Console의 최신 데이터 유형과 ephemeral processing 설명에 매핑
- [ ] `/privacy`의 호스트명·처리 정보와 Data safety 답변 일치
- [ ] 앱 내 공개 개인정보처리방침 링크와 Play 스토어 URL이 인증 없이 열리는지 확인

## 운영 선택에 따른 차이

### Hugging Face를 사용할 경우

- Hugging Face Spaces가 접속 일시·위치, IP, 기기·브라우저 정보 등을 자동 처리할 수 있다고 밝히므로 [Hugging Face 개인정보처리방침](https://huggingface.co/privacy)과 실제 Space 로그를 기준으로 신고 범위를 결정한다.
- 현재 Docker/Gradio CPU Space 생성은 PRO 구독이 필요해 운영 호스트로 확정되지 않았다.

### Vercel을 사용할 경우

- Vercel 프로젝트가 생성된 뒤 Functions runtime/access log에 남는 실제 필드와 보관 설정을 확인한다.
- Hobby 플랜은 개인·비상업 용도 제한과 사용량 한도가 있으므로 Play 출시 운영 목적에 맞는지 별도로 판단한다.
- 현재 CLI 인증을 확인하지 못해 프로젝트·배포·도메인이 없다.

## 최종 제출 책임

Data safety, Target audience, 콘텐츠 등급은 앱 운영자 계정에서 이루어지는 정책 선언입니다. Codex는 코드·의존성·네트워크 흐름을 조사하고 답변 근거를 준비할 수 있지만, 운영자는 Play Console에 제출하기 직전 실제 배포 상태를 확인하고 사실대로 승인해야 합니다.

## Google 공식 참고자료

- [Data safety 작성 안내](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [사용자 데이터 정책](https://support.google.com/googleplay/android-developer/answer/10144311)
- [개인정보처리방침 요구사항](https://support.google.com/googleplay/android-developer/answer/17105854)
- [App content 설정](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en-EN)
