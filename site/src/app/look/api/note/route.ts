import { handleNote } from '@/lib/deck-routes';

export const dynamic = 'force-dynamic';

export const POST = (req: Request) => handleNote('look', req);
