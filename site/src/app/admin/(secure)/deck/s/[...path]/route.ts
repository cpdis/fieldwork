import { serveDeck } from '@/lib/deck-routes';

export const dynamic = 'force-dynamic';

// The admin copy of the deck: open-slide's full UI and presenter view. Checks isAdmin().
export const GET = (req: Request) => serveDeck('admin', req);
