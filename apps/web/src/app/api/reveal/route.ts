import { getFullRanking, revealAnswer } from "@/lib/game-data";

export async function POST() {
  return Response.json({ ...revealAnswer(), rankings: getFullRanking() });
}
