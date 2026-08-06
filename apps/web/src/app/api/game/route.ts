import { getTodayGame } from "@/lib/game-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const { date, gameNumber, wordCount } = getTodayGame();
  return Response.json({ date, gameNumber, wordCount });
}
