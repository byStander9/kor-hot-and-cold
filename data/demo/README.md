# 데모 순위 데이터

이 폴더는 공개 자료로 재현한 소형 게임 데모입니다.

- 어휘: 초급·중급 일반 명사/동사/형용사 4,851개
- 문제: 수동으로 고른 20개 정답 후보
- 사전 출처: `binjang/NIKL-korean-english-dictionary`
- 사전 리비전: `3b4cfd2126debfd5440cade3ef6c2a3c20cf7cf9`
- 임베딩 모델: `intfloat/multilingual-e5-small`
- 모델 리비전: `614241f622f53c4eeff9890bdc4f31cfecc418b3`
- 생성 명령: `cd pipeline && uv run build-demo-data`

원본 사전과 모델 가중치는 이 저장소에 포함하지 않습니다. `dictionary.json`은 게임에서 입력을 확인하기 위한 최소 메타데이터만 담고, 뜻풀이와 용례는 포함하지 않습니다.

`evaluation.json`은 모델 검수용 상위 30개 근접어를 담고 있어 정답이 노출됩니다. 웹앱 배포 산출물에는 포함하지 않고 개발·검수에만 사용합니다.

이 데이터는 아직 사람 플레이 테스트를 통과한 정식 문제 세트가 아닙니다. 각 외부 자료의 원 라이선스와 출처는 [`../sources/data_sources.yml`](../sources/data_sources.yml)을 따릅니다.

