import { describe, expect, it } from 'vitest';
import { hasAnswers, readFeedback, renderFeedback } from '@/lib/feedback';

const read = (o: Record<string, string>) => readFeedback((k) => o[k]);

describe('feedback form', () => {
  it('keeps known answers and drops values the form never offers', () => {
    const f = read({ app: 'Claude', useful: '5', recommend: 'Maybe', keep: ' The quote prompt ' });
    expect(f).toMatchObject({ app: 'Claude', useful: 5, recommend: 'Maybe', keep: 'The quote prompt' });
    expect(read({ app: 'Gemini', useful: '9', recommend: 'Sure' })).toMatchObject({ app: null, useful: null, recommend: null });
  });

  it('needs at least one answer', () => {
    expect(hasAnswers(read({ name: 'Sam' }))).toBe(false);
    expect(hasAnswers(read({ change: 'Shorter lunch' }))).toBe(true);
  });

  it('writes a plain email with every question and escapes HTML', () => {
    const r = renderFeedback(read({ useful: '4', change: '<b>more labs</b>', name: 'Jo' }));
    expect(r.subject).toBe('Fieldwork feedback: 4/5 from Jo');
    expect(r.text).toContain('Should change: <b>more labs</b>');
    expect(r.html).toContain('&lt;b&gt;more labs&lt;/b&gt;');
    expect(r.text).toContain('From: Jo');
  });
});
