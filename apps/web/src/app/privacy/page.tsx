import type { Metadata } from "next";
import Link from "next/link";

import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 뜨겁고 차갑게",
  description: "뜨겁고 차갑게의 개인정보 처리 안내",
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
          뜨겁고 차갑게는 회원가입이나 로그인을 요구하지 않으며, 앱 자체의
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
          운영 호스트는 아직 확정되지 않았습니다. 최종 호스팅 사업자는 서비스 제공과
          보안을 위해 IP 주소, 요청 시각, 기기·브라우저 정보 같은 표준 접속 정보를
          처리할 수 있습니다. 사업자가 확정되면 처리 항목, 국외 처리 여부, 로그 보관
          기간과 해당 사업자의 개인정보처리방침을 이 문서에 반영합니다.
        </p>
        <p className={styles.notice}>
          이 방침은 출시 전 반드시 최종 운영 호스트, 실제 로그 설정과 보관 기간,
          공개 개인정보 문의 이메일로 갱신해야 합니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. 삭제와 문의</h2>
        <p>
          이 앱은 삭제를 요청할 수 있는 서버 계정이나 영구 플레이 데이터를 자체
          보유하지 않습니다. 기기에 저장된 진행 정보는 운영체제의 앱 데이터 삭제
          기능으로 지울 수 있습니다. 최종 호스팅 사업자가 처리하는 접속 정보에 관한
          권리는 출시 전에 고지할 해당 사업자의 방침과 문의 절차를 따릅니다.
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
