export const MAX_GUESS_LENGTH = 20;

export type Temperature = {
  label: "정답" | "매우 뜨거움" | "뜨거움" | "따뜻함" | "차가움";
  level: 0 | 1 | 2 | 3 | 4;
};

export type Schedule = {
  version: number;
  epoch: string;
  timezone: "Asia/Seoul";
  schedule: Array<{ day: number; puzzleId: string }>;
};

export function normalizeGuess(input: string): string {
  return input.normalize("NFC").replace(/\s+/g, "");
}

export function isValidGuess(input: string): boolean {
  return (
    input.length > 0 &&
    input.length <= MAX_GUESS_LENGTH &&
    /^[가-힣]+$/u.test(input)
  );
}

export function getSeoulDateKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function daysBetweenDateKeys(epoch: string, date: string): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${epoch}T00:00:00Z`)) /
      millisecondsPerDay,
  );
}

export function selectScheduledPuzzle(schedule: Schedule, date: string) {
  if (schedule.schedule.length === 0) {
    throw new Error("퍼즐 일정이 비어 있습니다.");
  }

  const elapsedDays = daysBetweenDateKeys(schedule.epoch, date);
  const index =
    ((elapsedDays % schedule.schedule.length) + schedule.schedule.length) %
    schedule.schedule.length;

  return {
    date,
    gameNumber: elapsedDays + 1,
    puzzleId: schedule.schedule[index].puzzleId,
  };
}

export function getTemperature(rank: number): Temperature {
  if (rank === 1) return { label: "정답", level: 4 };
  if (rank <= 10) return { label: "매우 뜨거움", level: 4 };
  if (rank <= 100) return { label: "뜨거움", level: 3 };
  if (rank <= 1000) return { label: "따뜻함", level: 2 };
  return { label: "차가움", level: 1 };
}
