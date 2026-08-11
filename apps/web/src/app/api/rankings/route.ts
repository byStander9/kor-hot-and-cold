import { isSupportedGameVersion, parseSeed } from "@/lib/game";
import { getRankingPage } from "@/lib/game-data";
import { getSeedGame } from "@/lib/game-metadata";

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 500;

function parseInteger(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const seed = parseSeed(query.get("seed"));
  if (seed === null || !isSupportedGameVersion(query.get("v"))) {
    return Response.json(
      { error: "시드 또는 게임 버전이 올바르지 않습니다." },
      { status: 422 },
    );
  }

  const offset = parseInteger(query.get("offset") ?? "0");
  const limit = parseInteger(query.get("limit") ?? String(DEFAULT_LIMIT));
  const wordCount = getSeedGame(seed).wordCount;

  if (
    offset === null ||
    offset < 0 ||
    offset >= wordCount ||
    limit === null ||
    limit < 1 ||
    limit > MAX_LIMIT
  ) {
    return Response.json(
      { error: `offset은 0 이상 어휘 수 미만, limit은 1부터 ${MAX_LIMIT} 사이여야 합니다.` },
      { status: 422 },
    );
  }

  return Response.json(getRankingPage(seed, offset, limit));
}
