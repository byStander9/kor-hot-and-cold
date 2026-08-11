import {
  isValidGuess,
  isSupportedGameVersion,
  MAX_GUESS_LENGTH,
  normalizeGuess,
  parseSeed,
} from "@/lib/game";
import { judgeGuess } from "@/lib/game-data";

type GuessRequest = {
  guess?: unknown;
  seed?: unknown;
  version?: unknown;
};

export async function POST(request: Request) {
  let body: GuessRequest;

  try {
    body = (await request.json()) as GuessRequest;
  } catch {
    return Response.json(
      { error: "올바른 JSON 요청이 아닙니다." },
      { status: 400 },
    );
  }

  if (typeof body.guess !== "string") {
    return Response.json(
      { error: "추측 단어를 문자열로 입력해 주세요." },
      { status: 400 },
    );
  }

  const guess = normalizeGuess(body.guess);
  if (!isValidGuess(guess)) {
    return Response.json(
      {
        error: `공백을 제외한 ${MAX_GUESS_LENGTH}자 이하의 한글 단어를 입력해 주세요.`,
      },
      { status: 422 },
    );
  }

  const seed = parseSeed(body.seed);
  if (seed === null || !isSupportedGameVersion(body.version)) {
    return Response.json(
      { error: "시드 또는 게임 버전이 올바르지 않습니다." },
      { status: 422 },
    );
  }

  const result = judgeGuess(guess, seed);
  if (!result) {
    return Response.json(
      { error: "현재 게임 사전에 없거나 아직 지원하지 않는 활용형입니다." },
      { status: 404 },
    );
  }

  return Response.json(result);
}
