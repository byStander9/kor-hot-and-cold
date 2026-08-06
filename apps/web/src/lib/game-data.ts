import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  getSeoulDateKey,
  getHintTargetRank,
  getTemperature,
  selectScheduledPuzzle,
  type Schedule,
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

type Puzzle = {
  version: number;
  id: string;
  answerWordId: number;
  ranks: number[];
  hintWordIds: number[];
};

const dataDirectoryCandidates = [
  path.resolve(process.cwd(), "../../data/demo"),
  path.resolve(process.cwd(), "data/demo"),
];

const dataDirectory = dataDirectoryCandidates.find(existsSync);

if (!dataDirectory) {
  throw new Error(
    "데모 데이터를 찾지 못했습니다. 저장소 루트의 data/demo를 생성해 주세요.",
  );
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(path.join(dataDirectory as string, relativePath), "utf8"),
  ) as T;
}

const dictionary = readJson<Dictionary>("dictionary.json");
const aliases = readJson<Aliases>("aliases.json");
const schedule = readJson<Schedule>("schedule.json");
const wordByText = new Map(dictionary.words.map((word) => [word.word, word]));
const aliasWordIdByText = new Map(
  Object.entries(aliases.aliases).map(([alias, wordId]) => [alias, wordId]),
);

export function getTodayGame(now = new Date()) {
  const selection = selectScheduledPuzzle(schedule, getSeoulDateKey(now));
  return {
    ...selection,
    wordCount: dictionary.words.length,
  };
}

function getTodayPuzzle(now = new Date()) {
  const game = getTodayGame(now);
  const puzzle = readJson<Puzzle>(`puzzles/${game.puzzleId}.json`);
  return { game, puzzle };
}

function makeGuessResult(word: DictionaryWord, puzzle: Puzzle) {
  const rank = puzzle.ranks[word.id];

  if (!Number.isInteger(rank)) {
    throw new Error(`퍼즐 ${puzzle.id}에 ${word.word}의 순위가 없습니다.`);
  }

  return {
    guess: word.word,
    rank,
    total: dictionary.words.length,
    temperature: getTemperature(rank),
    solved: word.id === puzzle.answerWordId,
  };
}

export function judgeGuess(guess: string, now = new Date()) {
  const aliasWordId = aliasWordIdByText.get(guess);
  const word =
    wordByText.get(guess) ??
    (aliasWordId === undefined ? undefined : dictionary.words[aliasWordId]);
  if (!word) return null;

  const { puzzle } = getTodayPuzzle(now);
  return makeGuessResult(word, puzzle);
}

export function getAdaptiveHint(bestRank: number, now = new Date()) {
  const { puzzle } = getTodayPuzzle(now);
  const targetRank = getHintTargetRank(bestRank);
  const wordId = puzzle.ranks.findIndex((rank) => rank === targetRank);
  const word = dictionary.words[wordId];
  return word ? makeGuessResult(word, puzzle) : null;
}

export function revealAnswer(now = new Date()) {
  const { puzzle } = getTodayPuzzle(now);
  const answer = dictionary.words[puzzle.answerWordId];

  if (!answer) {
    throw new Error(`퍼즐 ${puzzle.id}의 정답을 사전에서 찾지 못했습니다.`);
  }

  return { answer: answer.word };
}
