import GameClient from './GameClient';
import { logger } from '@/lib/utils/logger';
import { Game, Question } from '@/types/game';

type FullGamePayload = Game & {
  available_questions?: Question[];
  outside_board_questions?: Question[];
};

async function fetchGameOnServer(gameId: string): Promise<FullGamePayload | null> {
  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const res = await fetch(`${origin}/api/proxy/game/${gameId}`, {
      cache: 'no-store', // gameplay state should not be cached while live
    });

    if (!res.ok) {
      logger.warn(`Server fetch failed for game ${gameId}: ${res.status}`);
      return null;
    }

    const data = (await res.json()) as FullGamePayload;
    return data;
  } catch (err) {
    logger.exception(err, { where: 'game.[id].serverFetch' });
    return null;
  }
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initialGame = await fetchGameOnServer(id);

  return <GameClient gameId={id} initialGame={initialGame} />;
}