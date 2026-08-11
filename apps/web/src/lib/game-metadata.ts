import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { GAME_DATA_VERSION, selectAnswerWordId } from "./game";

type VectorMetadata = {
  version: number;
  wordCount: number;
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

if (vectorMetadata.version !== GAME_DATA_VERSION) {
  throw new Error("게임 메타데이터 버전이 현재 게임 버전과 일치하지 않습니다.");
}

export function getSeedGame(seed: number) {
  return {
    seed,
    version: GAME_DATA_VERSION,
    answerWordId: selectAnswerWordId(seed, vectorMetadata.wordCount),
    wordCount: vectorMetadata.wordCount,
  };
}
