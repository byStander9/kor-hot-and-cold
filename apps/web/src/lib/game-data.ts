import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  getSeoulDateKey,
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
const schedule = readJson<Schedule>("schedule.json");
const wordByText = new Map(dictionary.words.map((word) => [word.word, word]));

export function getTodayGame(now = new Date()) {
  const selection = selectScheduledPuzzle(schedule, getSeoulDateKey(now));
  return {
    ...selection,
    wordCount: dictionary.words.length,
  };
}

export function judgeGuess(guess: string, now = new Date()) {
  const word = wordByText.get(guess);
  if (!word) return null;

  const game = getTodayGame(now);
  const puzzle = readJson<Puzzle>(`puzzles/${game.puzzleId}.json`);
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
