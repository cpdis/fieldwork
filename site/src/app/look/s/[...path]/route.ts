import { serveDeck } from '@/lib/deck-routes';

export const dynamic = 'force-dynamic';

// The share-link copy of the deck (read-only player). Checks the link is still live.
export const GET = (req: Request) => serveDeck('look', req);
