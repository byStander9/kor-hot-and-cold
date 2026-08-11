import "server-only";

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  GAME_DATA_VERSION,
  LEXICON_DATA_VERSION,
  selectAnswerWordId,
} from "./game";

type VectorMetadata = {
  version: number;
  wordCount: number;
};

type AnswerPool = {
  gameVersion: number;
  lexiconVersion: number;
  policyVersion: number;
  count: number;
  sha256: string;
  wordIds: number[];
};

const dataDirectoryCandidates = [
  path.resolve(process.cwd(), "../../data/demo"),
  path.resolve(process.cwd(), "data/demo"),
];

const dataDirectory = dataDirectoryCandidates.find(existsSync);

if (!dataDirectory) {
  throw new Error(
    "게임 데이터를 찾지 못했습니다. 저장소 루트의 data/demo를 생성해 주세요.",
  );
}

const vectorMetadata = JSON.parse(
  readFileSync(path.join(dataDirectory, "vectors.json"), "utf8"),
) as VectorMetadata;
const answerPool = JSON.parse(
  readFileSync(path.join(dataDirectory, "answer-pool.json"), "utf8"),
) as AnswerPool;

const answerPoolHash = createHash("sha256")
  .update(JSON.stringify(answerPool.wordIds))
  .digest("hex");
if (
  vectorMetadata.version !== LEXICON_DATA_VERSION ||
  answerPool.gameVersion !== GAME_DATA_VERSION ||
  answerPool.lexiconVersion !== LEXICON_DATA_VERSION ||
  answerPool.count !== answerPool.wordIds.length ||
  answerPool.sha256 !== answerPoolHash ||
  answerPool.wordIds.length < 1 ||
  answerPool.wordIds.some(
    (wordId, index) =>
      !Number.isInteger(wordId) ||
      wordId < 0 ||
      wordId >= vectorMetadata.wordCount ||
      (index > 0 && answerPool.wordIds[index - 1] >= wordId),
  )
) {
  throw new Error("사전, 게임 버전 또는 안전 정답 풀의 무결성이 올바르지 않습니다.");
}

const answerWordIds = Int32Array.from(answerPool.wordIds);

export function getAnswerPoolWordIds() {
  return answerWordIds;
}

export function getSeedGame(seed: number) {
  const answerPoolIndex = selectAnswerWordId(seed, answerWordIds.length);
  return {
    seed,
    version: GAME_DATA_VERSION,
    answerWordId: answerWordIds[answerPoolIndex],
    wordCount: vectorMetadata.wordCount,
  };
}
