import type { Metadata } from "next";
import Link from "next/link";

import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 한국어 Hot and Cold",
  description: "한국어 Hot and Cold의 개인정보 처리 안내",
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/">
        ← 게임으로 돌아가기
      </Link>

      <header className={styles.header}>
        <p className={styles.eyebrow}>PRIVACY</p>
        <h1>개인정보처리방침</h1>
        <p className={styles.effectiveDate}>시행일: 2026년 8월 11일</p>
      </header>

      <section className={styles.section}>
        <h2>1. 서비스가 직접 수집·저장하는 정보</h2>
        <p>
          한국어 Hot and Cold는 회원가입이나 로그인을 요구하지 않으며, 앱 자체의
          사용자 계정 데이터베이스를 운영하지 않습니다. 광고, 이용자 분석 도구,
          푸시 알림 기능도 사용하지 않습니다.
        </p>
        <p>
          게임 시드, 추측 기록, 순위, 힌트 사용 및 완료 상태 같은 진행 정보는
          이용자의 기기 로컬 저장소에만 저장됩니다. 이 정보는 앱 데이터 삭제 또는
          앱 제거로 지울 수 있습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. 게임 서버로 전송되는 정보와 목적</h2>
        <p>
          게임을 제공하기 위해 시드와 게임 버전, 이용자가 입력한 추측어, 현재 최고
          순위 및 순위표 조회 범위가 서버로 전송됩니다. 이 값은 정답 판정, 힌트와
          순위표 응답을 만드는 목적으로 처리됩니다.
        </p>
        <p>
          앱 서버 코드는 이 요청 내용을 별도 데이터베이스나 플레이 기록 파일에
          영구 저장하지 않습니다. 추측 칸에는 이름, 연락처 등 개인을 식별할 수 있는
          정보를 입력하지 마세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. 호스팅 인프라</h2>
        <p>
          게임 서버는 Hugging Face Spaces에서 운영됩니다. Hugging Face는 서비스
          제공과 보안 등을 위해 접속 일시·위치, IP 주소, 기기와 브라우저 정보 등
          표준 서비스 이용 정보를 자동으로 처리할 수 있습니다. 이 처리는 한국어 Hot
          and Cold의 앱 데이터베이스와 별개이며, 보관 기간과 국외 처리 등 자세한
          내용은
          {" "}
          <a
            className={styles.inlineLink}
            href="https://huggingface.co/privacy"
            rel="noreferrer"
            target="_blank"
          >
            Hugging Face 개인정보처리방침
          </a>
          을 확인해 주세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. 삭제와 문의</h2>
        <p>
          이 앱은 삭제를 요청할 수 있는 서버 계정이나 영구 플레이 데이터를 자체
          보유하지 않습니다. 기기에 저장된 진행 정보는 운영체제의 앱 데이터 삭제
          기능으로 지울 수 있습니다. Hugging Face가 처리한 정보에 관한 권리는 해당
          사업자의 방침과 문의 절차를 따릅니다.
        </p>
        <p className={styles.notice}>
          프로젝트 개인정보 문의는
          {" "}
          <a
            className={styles.inlineLink}
            href="https://github.com/byStander9/kor-hot-and-cold/issues/new"
            rel="noreferrer"
            target="_blank"
          >
            GitHub Issues
          </a>
          에 공개적으로 남길 수 있습니다. 공개 게시물에 개인정보를 작성하지 마세요.
        </p>
      </section>
    </main>
  );
}
