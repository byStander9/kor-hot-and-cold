# 한국어 Hot and Cold 웹앱

한국어 의미 근접도 일일 단어 게임의 Next.js 웹 애플리케이션입니다. 공개 데이터로 미리 계산한 순위를 서버에서 읽고, 브라우저에는 오늘 퍼즐의 정답이나 전체 순위표를 보내지 않는 구조로 개발합니다.

## 실행

저장소 루트에서 데이터 파이프라인을 한 번 실행한 뒤 웹앱을 시작합니다.

```powershell
cd pipeline
uv sync --extra dev
uv run build-demo-data

cd ../apps/web
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 검사

```powershell
npm run lint
npm run build
```

전체 프로젝트의 데이터 출처, 개발 과정, 라이선스는 저장소 루트의 한글 `README.md`에서 확인할 수 있습니다.
