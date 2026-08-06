import { randomBytes } from "node:crypto";

import { redirect } from "next/navigation";

import GameBoard from "@/components/game-board";
import { GAME_DATA_VERSION, isSupportedGameVersion, parseSeed } from "@/lib/game";
import { getSeedGame } from "@/lib/game-data";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ seed?: string | string[]; v?: string | string[] }>;
};

export default async function Home({ searchParams }: Props) {
  const query = await searchParams;
  const seed = parseSeed(query.seed);
  if (seed === null) {
    const randomSeed = randomBytes(4).readUInt32BE(0);
    redirect(`/?seed=${randomSeed}&v=${GAME_DATA_VERSION}`);
  }
  if (!isSupportedGameVersion(Array.isArray(query.v) ? query.v[0] : query.v)) {
    redirect(`/?seed=${seed}&v=${GAME_DATA_VERSION}`);
  }

  const game = getSeedGame(seed);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="#game" aria-label="게임 입력으로 이동">
          <span className={styles.brandHot}>HOT</span>
          <span className={styles.brandAnd}>&amp;</span>
          <span className={styles.brandCold}>COLD</span>
        </a>
        <p className={styles.gameNumber}>시드 #{game.seed}</p>
      </header>

      <section className={styles.hero} aria-labelledby="game-title">
        <p className={styles.eyebrow}>한국어 의미 탐색 게임</p>
        <h1 id="game-title">시드의 비밀 단어를 찾아보세요.</h1>
        <p className={styles.lead}>
          단어를 입력하면 정답과 의미가 가까운 순위를 알려드려요. 숫자가 작을수록
          뜨겁고, <strong>1위가 정답</strong>입니다.
        </p>
      </section>

      <GameBoard
        key={`${game.version}:${game.seed}`}
        wordCount={game.wordCount}
        seed={game.seed}
        gameVersion={game.version}
      />

      <aside className={styles.guide} aria-labelledby="guide-title">
        <h2 id="guide-title">어떻게 가까움을 정하나요?</h2>
        <p>
          공개 한국어 사전의 표제어·품사·뜻풀이를 공개 다국어 임베딩 모델로
          비교했습니다. 반대말도 비슷한 문맥에서 자주 쓰이면 가깝게 나올 수 있어요.
        </p>
        <p className={styles.sourceNote}>
          현재 데모 어휘 {game.wordCount.toLocaleString("ko-KR")}개 · 조사와 자주 쓰는
          활용형은 기본형으로 자동 연결합니다.
        </p>
      </aside>
    </main>
  );
}
