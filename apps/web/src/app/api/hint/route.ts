import { isSupportedGameVersion, parseSeed } from "@/lib/game";
import { getAdaptiveHint } from "@/lib/game-data";
import { getSeedGame } from "@/lib/game-metadata";

type HintRequest = {
  bestRank?: unknown;
  seed?: unknown;
  version?: unknown;
};

export async function POST(request: Request) {
  let body: HintRequest;

  try {
    body = (await request.json()) as HintRequest;
  } catch {
    return Response.json({ error: "올바른 JSON 요청이 아닙니다." }, { status: 400 });
  }

  const seed = parseSeed(body.seed);
  if (seed === null || !isSupportedGameVersion(body.version)) {
    return Response.json(
      { error: "시드 또는 게임 버전이 올바르지 않습니다." },
      { status: 422 },
    );
  }

  if (
    !Number.isInteger(body.bestRank) ||
    (body.bestRank as number) < 2 ||
    (body.bestRank as number) > getSeedGame(seed).wordCount + 1
  ) {
    return Response.json(
      { error: "현재 최고 순위가 올바르지 않습니다." },
      { status: 422 },
    );
  }

  const hint = getAdaptiveHint(body.bestRank as number, seed);
  if (!hint) {
    return Response.json({ error: "사용 가능한 힌트가 없습니다." }, { status: 404 });
  }

  return Response.json(hint);
}
