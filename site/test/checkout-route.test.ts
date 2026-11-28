import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/checkout/route';

const post = (body: unknown) =>
  POST(new Request('http://localhost/api/checkout', { method: 'POST', body: JSON.stringify(body) }));

describe('POST /api/checkout', () => {
  it('rejects an ABN that fails the checksum before holding a seat', async () => {
    const res = await post({ slug: 'any', name: 'Pat Example', email: 'pat@example.com', abn: '12 345 678 901' });
    expect(res.status).toBe(400);
    expect((await res.json()).reason).toBe('abn');
  });

  it('rejects a missing name or bad email', async () => {
    const res = await post({ slug: 'any', name: '', email: 'nope' });
    expect(res.status).toBe(400);
  });
});
