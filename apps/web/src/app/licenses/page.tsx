import type { Metadata } from "next";
import Link from "next/link";

import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "데이터·오픈소스 출처 | 한국어 Hot and Cold",
  description: "한국어 Hot and Cold가 사용한 공개 데이터와 오픈소스 안내",
};

const sources = [
  {
    name: "표준국어대사전 Hugging Face 변환본",
    href: "https://huggingface.co/datasets/hac541309/stdict_kor",
    license: "데이터셋 카드 CC BY-SA 3.0, 원자료 안내 CC BY-SA 2.0",
    use: "표제어·품사·뜻풀이와 의미 벡터 생성",
  },
  {
    name: "NIKL Korean-English Dictionary 변환본",
    href: "https://huggingface.co/datasets/binjang/NIKL-korean-english-dictionary",
    license: "데이터셋 카드 MIT, 국립국어원 원자료 조건 병행 확인 대상",
    use: "표제어·품사·뜻풀이와 난이도 정보 구성",
  },
  {
    name: "intfloat/multilingual-e5-small",
    href: "https://huggingface.co/intfloat/multilingual-e5-small",
    license: "MIT",
    use: "뜻풀이 기반 의미 임베딩을 빌드 시 오프라인 생성",
  },
  {
    name: "Kiwi 한국어 형태소 분석기",
    href: "https://github.com/bab2min/Kiwi",
    license: "LGPL-3.0",
    use: "조사·활용형 별칭을 빌드 시 오프라인 생성",
  },
] as const;

export default function LicensesPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/">
        ← 게임으로 돌아가기
      </Link>

      <header className={styles.header}>
        <p className={styles.eyebrow}>OPEN SOURCES</p>
        <h1>데이터·오픈소스 출처</h1>
        <p className={styles.effectiveDate}>최종 갱신: 2026년 8월 11일</p>
      </header>

      <section className={styles.section}>
        <h2>프로젝트 코드</h2>
        <p>
          프로젝트가 직접 작성한 코드는
          {" "}
          <a
            className={styles.inlineLink}
            href="https://github.com/byStander9/kor-hot-and-cold/blob/main/LICENSE"
            rel="noreferrer"
            target="_blank"
          >
            MIT License
          </a>
          로 공개합니다. 이 라이선스는 아래 외부 데이터·모델·소프트웨어의 원
          라이선스를 대신하지 않습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2>게임 데이터와 모델</h2>
        {sources.map((source) => (
          <article key={source.name}>
            <h3>
              <a
                className={styles.inlineLink}
                href={source.href}
                rel="noreferrer"
                target="_blank"
              >
                {source.name}
              </a>
            </h3>
            <ul>
              <li>표시 라이선스: {source.license}</li>
              <li>이 프로젝트의 사용: {source.use}</li>
            </ul>
          </article>
        ))}
        <p className={styles.notice}>
          모델 가중치는 앱에 포함하지 않으며, 사전 원문도 그대로 제공하지 않습니다.
          서버의 어휘·별칭·양자화 벡터 등 파생 산출물에는 각 원자료의 저작자 표시와
          동일조건변경허락 의무가 적용될 수 있습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2>주요 오픈소스 소프트웨어</h2>
        <p>
          웹 서버와 앱은 Next.js, React, Expo와 React Native를 사용합니다. 정확한
          버전과 전체 직접·간접 의존성은 공개 저장소의 `package.json`과
          `package-lock.json`에서 확인할 수 있으며, 각 패키지의 원 라이선스를
          따릅니다.
        </p>
        <p>
          고정 리비전과 재배포 판단의 상세 기록은
          {" "}
          <a
            className={styles.inlineLink}
            href="https://github.com/byStander9/kor-hot-and-cold/blob/main/data/sources/data_sources.yml"
            rel="noreferrer"
            target="_blank"
          >
            데이터 출처 목록
          </a>
          에서 확인할 수 있습니다.
        </p>
      </section>
    </main>
  );
}
