# GHCR 컨테이너 이미지 배포

확인일: 2026년 8월 11일

이 저장소는 운영 API를 실행할 수 있는 Docker 이미지를 `ghcr.io/bystander9/kor-hot-and-cold-api`에 게시하도록 준비되어 있습니다. **GHCR은 이미지 저장소이지 실행 호스트가 아니므로, 이미지를 게시하는 것만으로 공개 HTTPS 게임 서버가 생기지는 않습니다.** 별도의 무료 또는 유료 컨테이너 실행 환경이 여전히 필요합니다.

## 워크플로 동작

`.github/workflows/container.yml`은 다음 경우에만 동작합니다.

- Pull request: `linux/amd64` 이미지를 build만 하고 registry에 push하지 않습니다. 권한도 `contents: read`만 사용합니다.
- `v*.*.*` 버전 태그 push: semver, `latest`, commit SHA 태그로 build·push합니다.
- `workflow_dispatch`: `manual`과 commit SHA 태그로 build·push합니다.

게시 job만 `packages: write`, `attestations: write`, `id-token: write` 권한을 가지며, `GITHUB_TOKEN`으로 GHCR에 로그인합니다. Docker Buildx의 GitHub Actions cache를 재사용하고 `actions/attest`로 이미지 digest의 build provenance를 게시합니다.

공개 저장소의 표준 `ubuntu-latest` runner 사용은 무료이며, 공개 GitHub Package도 무료입니다. larger runner나 유료 서비스는 사용하지 않습니다.

- [GitHub Actions public repository billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [GitHub Packages billing](https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages)
- [GitHub 공식 컨테이너 게시 예제](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images)

## 현재 브랜치에서 바로 dispatch하지 않는 이유

이 워크플로는 아직 `mobile-app`이나 기본 브랜치 `main`에 병합되지 않은 `feature/hf-production-api`에만 있습니다. GitHub의 수동 실행 목록에서 `workflow_dispatch`를 사용하려면 워크플로 파일이 기본 브랜치에 존재해야 합니다.

따라서 다음 중 하나가 먼저 필요합니다.

1. 승인된 변경을 통합 브랜치와 기본 브랜치에 반영한 뒤 Actions에서 수동 실행한다.
2. 워크플로가 포함된 승인된 commit에 `v1.0.0` 같은 버전 태그를 push해 tag trigger를 사용한다.

현재 기능 브랜치만으로 package를 먼저 게시하면 승인 전 변경을 release artifact로 만들게 되므로 실행하지 않습니다.

## 최초 push 후 사용자가 확인할 설정

GHCR의 개인 계정 package는 첫 게시 때 기본적으로 private입니다. 공개 저장소에서 만들었다고 자동으로 public이 되지 않습니다.

1. GitHub 프로필의 **Packages**에서 `kor-hot-and-cold-api`를 엽니다.
2. **Package settings**에서 source repository가 `byStander9/kor-hot-and-cold`로 연결됐는지 확인합니다.
3. **Change visibility**에서 `Public`을 선택하고 package 이름을 입력해 확인합니다.
4. 로그아웃 상태에서 package 페이지가 열리고 아래 `docker pull`이 인증 없이 되는지 확인합니다.

공개 package는 익명 pull을 허용합니다. GitHub는 public으로 바꾼 package를 다시 private으로 돌릴 수 없다고 경고하므로 이 변경은 사용자가 직접 확인해야 합니다.

- [GHCR package visibility 설정](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility)
- [Container registry 사용법](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

## 이미지 크기와 라이선스

이미지는 약 145MB의 `data/demo`와 Node.js·Next.js runtime layer를 포함하므로 source repository보다 큽니다. 정확한 compressed/uncompressed 크기는 첫 Actions build summary와 GHCR package에서 확인해야 합니다. 단일 `linux/amd64` 이미지만 만들어 불필요한 multi-architecture 중복을 피합니다.

이미지에는 다음 고지를 함께 넣습니다.

- `/home/node/app/LICENSE`: 프로젝트 자체 코드의 MIT License
- `/home/node/app/THIRD_PARTY_NOTICES.md`: 사전·모델·Kiwi와 runtime 의존성 안내
- `/home/node/app/data/demo/README.md`: 생성 데이터 설명
- 웹 `/licenses`: 이용자가 볼 수 있는 한국어 출처 페이지

표준국어대사전 변환 데이터의 CC BY-SA 조건 등 원자료 의무가 계속 적용되므로 container 전체를 단순히 MIT라고 표시하지 않습니다. 오래된 이미지 tag를 많이 유지하면 package 용량이 증가하므로 정식 버전과 SHA tag 수를 모니터링하되, 자동 삭제는 구성하지 않습니다.

## 이미지 실행·검증

package가 public으로 바뀐 뒤 다음과 같이 실행할 수 있습니다.

```bash
docker pull ghcr.io/bystander9/kor-hot-and-cold-api:latest
docker run --rm -p 7860:7860 ghcr.io/bystander9/kor-hot-and-cold-api:latest
```

다른 터미널에서 확인합니다.

```bash
curl http://127.0.0.1:7860/api/health
curl "http://127.0.0.1:7860/api/game?seed=123&v=1"
```

실행 호스트를 정한 뒤에는 HTTPS 주소에서 health, game, guess, CORS preflight, 정답 비노출, cold start를 다시 검증하고 그 주소를 모바일 `EXPO_PUBLIC_API_BASE_URL`에 설정해야 합니다.
