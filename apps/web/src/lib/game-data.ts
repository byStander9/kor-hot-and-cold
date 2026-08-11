import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  GAME_DATA_VERSION,
  getHintTargetRank,
  getTemperature,
  selectAnswerWordId,
} from "./game";

type DictionaryWord = {
  id: number;
  word: string;
  pos: string;
  level: string;
  category: string;
};

type Dictionary = {
  version: number;
  words: DictionaryWord[];
};

type Aliases = {
  version: number;
  count: number;
  aliases: Record<string, number>;
};

type VectorMetadata = {
  version: number;
  format: "int8-row-major";
  dimensions: number;
  scale: number;
  wordCount: number;
  model: { repoId: string; revision: string };
  shards: Array<{ file: string; startWordId: number; wordCount: number }>;
};

type SeedRanking = {
  seed: number;
  answerWordId: number;
  ranks: Int32Array;
  wordIdsByRank: Int32Array;
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

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(path.join(dataDirectory as string, relativePath), "utf8"),
  ) as T;
}

const dictionary = readJson<Dictionary>("dictionary.json");
const aliases = readJson<Aliases>("aliases.json");
const vectorMetadata = readJson<VectorMetadata>("vectors.json");

if (
  vectorMetadata.version !== GAME_DATA_VERSION ||
  vectorMetadata.format !== "int8-row-major" ||
  vectorMetadata.wordCount !== dictionary.words.length
) {
  throw new Error("사전과 임베딩 데이터의 버전 또는 어휘 수가 일치하지 않습니다.");
}

const vectorBuffer = Buffer.concat(
  vectorMetadata.shards.map((shard) => {
    const buffer = readFileSync(path.join(dataDirectory, shard.file));
    const expectedBytes = shard.wordCount * vectorMetadata.dimensions;
    if (buffer.byteLength !== expectedBytes) {
      throw new Error(`${shard.file}의 크기가 메타데이터와 일치하지 않습니다.`);
    }
    return buffer;
  }),
);
if (
  vectorBuffer.byteLength !==
  vectorMetadata.wordCount * vectorMetadata.dimensions
) {
  throw new Error("전체 임베딩 크기가 메타데이터와 일치하지 않습니다.");
}
const vectors = new Int8Array(
  vectorBuffer.buffer,
  vectorBuffer.byteOffset,
  vectorBuffer.byteLength,
);
const wordByText = new Map(dictionary.words.map((word) => [word.word, word]));
const aliasWordIdByText = new Map(Object.entries(aliases.aliases));
const nounParticles = [
  "에게",
  "에서",
  "으로",
  "부터",
  "까지",
  "은",
  "는",
  "이",
  "가",
  "을",
  "를",
  "과",
  "와",
  "로",
  "도",
  "만",
  "의",
  "에",
] as const;
const rankingCache = new Map<number, SeedRanking>();
const MAX_CACHED_RANKINGS = 4;

export function getSeedGame(seed: number) {
  return {
    seed,
    version: GAME_DATA_VERSION,
    answerWordId: selectAnswerWordId(seed, dictionary.words.length),
    wordCount: dictionary.words.length,
  };
}

function createSeedRanking(seed: number): SeedRanking {
  const game = getSeedGame(seed);
  const dimensions = vectorMetadata.dimensions;
  const answerOffset = game.answerWordId * dimensions;
  const scores = new Int32Array(game.wordCount);
  const wordIds = Array.from({ length: game.wordCount }, (_, wordId) => wordId);

  for (let wordId = 0; wordId < game.wordCount; wordId += 1) {
    const wordOffset = wordId * dimensions;
    let score = 0;
    for (let dimension = 0; dimension < dimensions; dimension += 1) {
      score +=
        vectors[wordOffset + dimension] * vectors[answerOffset + dimension];
    }
    scores[wordId] = score;
  }

  wordIds.sort((left, right) => {
    if (left === game.answerWordId) return -1;
    if (right === game.answerWordId) return 1;
    return scores[right] - scores[left] || left - right;
  });

  const ranks = new Int32Array(game.wordCount);
  const wordIdsByRank = Int32Array.from(wordIds);
  for (let index = 0; index < wordIdsByRank.length; index += 1) {
    ranks[wordIdsByRank[index]] = index + 1;
  }

  return { seed, answerWordId: game.answerWordId, ranks, wordIdsByRank };
}

function getSeedRanking(seed: number) {
  const cached = rankingCache.get(seed);
  if (cached) {
    rankingCache.delete(seed);
    rankingCache.set(seed, cached);
    return cached;
  }

  const ranking = createSeedRanking(seed);
  rankingCache.set(seed, ranking);
  if (rankingCache.size > MAX_CACHED_RANKINGS) {
    const oldestSeed = rankingCache.keys().next().value;
    if (oldestSeed !== undefined) rankingCache.delete(oldestSeed);
  }
  return ranking;
}

function makeGuessResult(word: DictionaryWord, ranking: SeedRanking) {
  const rank = ranking.ranks[word.id];
  return {
    guess: word.word,
    rank,
    total: dictionary.words.length,
    temperature: getTemperature(rank),
    solved: word.id === ranking.answerWordId,
  };
}

function findNounAliasWord(guess: string) {
  for (const particle of nounParticles) {
    if (!guess.endsWith(particle) || guess.length <= particle.length) continue;

    const word = wordByText.get(guess.slice(0, -particle.length));
    if (word?.pos.split("/").includes("명사")) return word;
  }

  return undefined;
}

export function judgeGuess(guess: string, seed: number) {
  const aliasWordId = aliasWordIdByText.get(guess);
  const word =
    wordByText.get(guess) ??
    (aliasWordId === undefined ? undefined : dictionary.words[aliasWordId]) ??
    findNounAliasWord(guess);
  if (!word) return null;

  return makeGuessResult(word, getSeedRanking(seed));
}

export function getAdaptiveHint(bestRank: number, seed: number) {
  const ranking = getSeedRanking(seed);
  const targetRank = getHintTargetRank(bestRank);
  const word = dictionary.words[ranking.wordIdsByRank[targetRank - 1]];
  return word ? makeGuessResult(word, ranking) : null;
}

export function getRankingPage(seed: number, offset: number, limit: number) {
  const ranking = getSeedRanking(seed);
  const end = Math.min(offset + limit, ranking.wordIdsByRank.length);
  const items = [];

  for (let index = offset; index < end; index += 1) {
    const wordId = ranking.wordIdsByRank[index];
    items.push({
      word: dictionary.words[wordId].word,
      rank: index + 1,
    });
  }

  return {
    items,
    offset,
    limit,
    total: ranking.wordIdsByRank.length,
    nextOffset: end < ranking.wordIdsByRank.length ? end : null,
  };
}

export function revealAnswer(seed: number) {
  const ranking = getSeedRanking(seed);
  const answer = dictionary.words[ranking.answerWordId];
  if (!answer) throw new Error("정답을 사전에서 찾지 못했습니다.");
  return { answer: answer.word };
}
