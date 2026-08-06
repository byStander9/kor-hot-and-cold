import { isSupportedGameVersion, parseSeed } from "@/lib/game";
import { getSeedGame } from "@/lib/game-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const seed = parseSeed(query.get("seed"));
  if (seed === null || !isSupportedGameVersion(query.get("v"))) {
    return Response.json({ error: "시드 또는 게임 버전이 올바르지 않습니다." }, { status: 422 });
  }
  const game = getSeedGame(seed);
  return Response.json({ seed: game.seed, version: game.version, wordCount: game.wordCount });
}
