import { ImageResponse } from 'next/og';

export const alt = 'Fieldwork: one hands-on AI day in Perth. The models are already good enough. The gap is the habit of asking.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** The link preview: the headline on paper, the yellow highlighter on "asking", as on the page. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#f6f6f3', color: '#141518' }}>
        <div style={{ fontSize: 28, letterSpacing: 2, textTransform: 'uppercase' }}>Fieldwork · Perth</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
          The models are already good enough. The gap is the habit of&nbsp;<span style={{ background: '#ffc400', padding: '0 8px' }}>asking</span>.
        </div>
        <div style={{ fontSize: 28, color: '#5c5e63' }}>One hands-on day. ChatGPT and Claude, side by side.</div>
      </div>
    ),
    size,
  );
}
