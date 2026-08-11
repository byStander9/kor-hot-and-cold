import { GAME_DATA_VERSION } from "../../../lib/game";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "ok", version: GAME_DATA_VERSION },
    { headers: { "Cache-Control": "no-store" } },
  );
}
