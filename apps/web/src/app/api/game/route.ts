import { getTodayGame } from "@/lib/game-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getTodayGame());
}
