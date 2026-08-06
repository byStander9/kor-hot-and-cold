import { getAdaptiveHint, getTodayGame } from "@/lib/game-data";

type HintRequest = {
  bestRank?: unknown;
};

export async function POST(request: Request) {
  let body: HintRequest;

  try {
    body = (await request.json()) as HintRequest;
  } catch {
    return Response.json({ error: "올바른 JSON 요청이 아닙니다." }, { status: 400 });
  }

  if (
    !Number.isInteger(body.bestRank) ||
    (body.bestRank as number) < 2 ||
    (body.bestRank as number) > getTodayGame().wordCount + 1
  ) {
    return Response.json(
      { error: "현재 최고 순위가 올바르지 않습니다." },
      { status: 422 },
    );
  }

  const hint = getAdaptiveHint(body.bestRank as number);
  if (!hint) {
    return Response.json({ error: "사용 가능한 힌트가 없습니다." }, { status: 404 });
  }

  return Response.json(hint);
}
