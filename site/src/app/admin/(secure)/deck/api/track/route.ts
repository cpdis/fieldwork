import { handleTrack } from '@/lib/deck-routes';

export const dynamic = 'force-dynamic';

export const POST = (req: Request) => handleTrack('admin', req);
