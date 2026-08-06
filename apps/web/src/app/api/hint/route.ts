import { getHint } from "@/lib/game-data";

type HintRequest = {
  hintIndex?: unknown;
};

export async function POST(request: Request) {
  let body: HintRequest;

  try {
    body = (await request.json()) as HintRequest;
  } catch {
    return Response.json({ error: "올바른 JSON 요청이 아닙니다." }, { status: 400 });
  }

  if (
    !Number.isInteger(body.hintIndex) ||
    (body.hintIndex as number) < 0 ||
    (body.hintIndex as number) > 2
  ) {
    return Response.json(
      { error: "힌트 번호는 0부터 2 사이여야 합니다." },
      { status: 422 },
    );
  }

  const hint = getHint(body.hintIndex as number);
  if (!hint) {
    return Response.json({ error: "사용 가능한 힌트가 없습니다." }, { status: 404 });
  }

  return Response.json(hint);
}
