import { isSupportedGameVersion, parseSeed } from "@/lib/game";
import { revealAnswer } from "@/lib/game-data";

type RevealRequest = { seed?: unknown; version?: unknown };

export async function POST(request: Request) {
  let body: RevealRequest;
  try {
    body = (await request.json()) as RevealRequest;
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
  return Response.json(revealAnswer(seed));
}
