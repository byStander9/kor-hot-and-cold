# 데이터·모델 출처 관리

이 프로젝트는 공개 자료를 적극 활용하되 **공개되어 있다는 이유만으로 자유로운 재배포가 가능하다고 가정하지 않는다.** 각 자료의 출처, 고정 리비전, 라이선스, 사용 목적과 재배포 판단을 [`data/sources/data_sources.yml`](../data/sources/data_sources.yml)에 기록한다.

## Hugging Face 활용 원칙

- 모델과 데이터셋은 저장소 이름뿐 아니라 40자리 커밋 SHA로 고정한다.
- Hub 메타데이터에 라이선스가 없으면 자동 파이프라인에서 제외한다.
- 모델 가중치와 대용량 데이터는 GitHub 저장소에 복제하지 않는다.
- 실행 시 Hugging Face Hub에서 내려받고 캐시한다.
- 공개 산출물에는 사용한 저장소 ID, 리비전, 라이선스를 표시한다.
- 제3자가 올린 변환 데이터셋은 원자료 제공자의 조건도 별도로 확인한다.

## 현재 조사 결과

| 상태 | 자료 | Hub 표시 라이선스 | 판단 |
|---|---|---|---|
| 후보 | `binjang/NIKL-korean-english-dictionary` | MIT | 필드가 목적에 잘 맞지만 국립국어원 원자료 조건을 재확인해야 함 |
| 후보 | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` | Apache-2.0 | 한국어 포함 다국어 기준 모델로 비교 |
| 후보 | `intfloat/multilingual-e5-small` | MIT | 정의 기반 검색 임베딩 후보로 비교 |
| 사용 | `Kiwi/kiwipiepy` | LGPL-3.0 | 오프라인에서 조사·불규칙 활용형 별칭 생성 |
| 제외 | `BM-K/KoSimCSE-roberta-multitask` | 미표기 | 라이선스 확인 전 사용·배포하지 않음 |

## 메타데이터 검증

```powershell
cd pipeline
uv sync --extra dev
uv run verify-sources
uv run pytest
```

`verify-sources`는 Hugging Face API의 현재 커밋 SHA와 라이선스 태그가 출처 목록에 기록된 값과 같은지 확인한다. 원격 저장소가 업데이트되더라도 자동으로 새 버전을 채택하지 않으며, 변경 내용을 검토한 뒤 명시적으로 리비전을 올린다.

## 공개하지 않는 항목

- API 인증키
- 원자료 이용약관이 재배포를 허용하지 않는 원문
- Hugging Face가 별도 배포하는 모델 가중치
- 생성 중간 파일, 전체 임베딩 행렬, 개인 플레이 로그
