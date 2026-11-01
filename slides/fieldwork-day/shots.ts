/*
 * Real screenshots and clips used in the deck. One entry per file in assets/shots/.
 * A page asks for a shot by id; until the file exists, the page shows a labelled gap.
 * The capture list for the person collecting them is generated from this file:
 *   node scripts/shot-list.mjs fieldwork-day
 *
 * Files: images as .jpg, .png or .webp. Clips as .mp4 (H.264, no sound track, at most
 * 1280 px wide, 8 to 20 seconds, under 4 MB). Name the file exactly <id>.<ext>.
 */
export type ShotSpec = {
  id: string;
  kind: 'image' | 'clip';
  /** Where the original lives. */
  url: string;
  /** Text for the browser bar when a page shows the shot in a browser frame. */
  show?: string;
  /** What to capture, in one line. */
  capture: string;
  /** Who made it, for the source line. */
  credit: string;
  /** Where the deck uses it. */
  used: string;
  alt: string;
};

export const SHOTS: ShotSpec[] = [
  /* ---- Block 1: real owners, real jobs ---- */
  {
    id: 'wcd-1',
    kind: 'image',
    url: 'https://pbs.twimg.com/media/HUEgJtkasAAmQhF.jpg?name=orig',
    capture: 'Photo 1 of 4 from the West Coast Deck post (download the original image)',
    credit: 'Jameson Haslam, West Coast Deck, on X, Oct 2026',
    used: 'Block 1 owners page; Block 3 deck-builder story',
    alt: 'Photo from the West Coast Deck post',
  },
  {
    id: 'wcd-2',
    kind: 'image',
    url: 'https://pbs.twimg.com/media/HUEgJtkbcAA2e_Y.jpg?name=orig',
    capture: 'Photo 2 of 4 from the West Coast Deck post',
    credit: 'Jameson Haslam, West Coast Deck, on X, Oct 2026',
    used: 'Block 3 deck-builder story',
    alt: 'Photo from the West Coast Deck post',
  },
  {
    id: 'wcd-3',
    kind: 'image',
    url: 'https://pbs.twimg.com/media/HUEgJtkaUAAZzNr.jpg?name=orig',
    capture: 'Photo 3 of 4 from the West Coast Deck post',
    credit: 'Jameson Haslam, West Coast Deck, on X, Oct 2026',
    used: 'Block 3 deck-builder story',
    alt: 'Photo from the West Coast Deck post',
  },
  {
    id: 'wcd-4',
    kind: 'image',
    url: 'https://pbs.twimg.com/media/HUEgiY5a4AA4hiD.jpg?name=orig',
    capture: 'Photo 4 of 4 from the West Coast Deck post',
    credit: 'Jameson Haslam, West Coast Deck, on X, Oct 2026',
    used: 'Block 3 deck-builder story',
    alt: 'Photo from the West Coast Deck post',
  },
  {
    id: 'oakcreek',
    kind: 'image',
    url: 'https://www.wral.com/your-plumber-has-a-new-favorite-tool-chatgpt/22193477/',
    show: 'wral.com · CNN · “Your plumber has a new favorite tool: ChatGPT”',
    capture: 'The story page with its headline and lead photo, 1600 × 1000 browser window',
    credit: 'Bryan Mena, CNN, Oct 2025',
    used: 'Block 1 owners page',
    alt: 'News story about plumbers using ChatGPT',
  },
  {
    id: 'mothership',
    kind: 'clip',
    url: 'https://youtu.be/yxeHQvby5JY',
    capture: 'The Monday brief on screen: 10 to 15 seconds where the finished brief is readable',
    credit: 'Anthropic, Claude for Small Business demo with Mothership Coffee Roasters, Sep 2026',
    used: 'Block 1 owners page',
    alt: 'A café group’s Monday brief in Claude',
  },
  {
    id: 'hireeffect',
    kind: 'clip',
    url: 'https://youtu.be/sD1_ERv4nDM',
    capture: 'The month-end close: 10 to 15 seconds where the flagged transactions are on screen',
    credit: 'Anthropic, Claude for Small Business demo with HireEffect, Sep 2026',
    used: 'Block 1 owners page',
    alt: 'A bookkeeping firm’s month-end check in Claude',
  },
  {
    id: 'sportsfit',
    kind: 'image',
    url: 'https://www.nab.com.au/news/technology-ai/how-australian-small-businesses-are-using-ai-to-save-time',
    show: 'nab.com.au · How Australian small businesses are using AI to save time',
    capture: 'The SportsFit section of the article, with its photo, 1600 × 1000 browser window',
    credit: 'NAB, Aug 2026',
    used: 'Block 1 owners page',
    alt: 'NAB story about a physiotherapy practice',
  },
  {
    id: 'bella',
    kind: 'image',
    url: 'https://www.nab.com.au/news/technology-ai/how-are-small-businesses-using-ai',
    show: 'nab.com.au · Case studies: How are small businesses using AI?',
    capture: 'The Bella Manufacturing section with the factory-floor photo, 1600 × 1000 browser window',
    credit: 'NAB, Apr 2026',
    used: 'Block 1 owners page',
    alt: 'NAB story about a vehicle fit-out manufacturer',
  },
  /* ---- Block 4: small tools that fit one business ---- */
  {
    id: 'bambi',
    kind: 'clip',
    url: 'https://youtu.be/D2FcNf2v9KY',
    capture: 'The scan-to-wishlist tool in use: 10 to 15 seconds showing a scan and the wishlist it makes',
    credit: 'Anthropic, Claude for Small Business demo with Bambi Baby, Sep 2026',
    used: 'Block 4 real-tools page',
    alt: 'A baby-gear store’s scan-to-wishlist tool',
  },
  {
    id: 'kane',
    kind: 'clip',
    url: 'https://youtu.be/ZV3oKch1t_I',
    capture: 'The proposal builder: 10 to 15 seconds where the drafted proposal or statement of work is on screen',
    credit: 'Anthropic, Claude for Small Business demo with KANE, Sep 2026',
    used: 'Block 4 real-tools page',
    alt: 'An agency’s proposal builder in Claude',
  },
  {
    id: 'packlab',
    kind: 'clip',
    url: 'https://youtu.be/OuC6eIiAta0',
    capture: 'The “packaging lab” section: 10 to 15 seconds of the team voting on thumbnails',
    credit: 'Anthony Dupont-Cinko, Claude artifacts walkthrough, Oct 2026',
    used: 'Block 4 real-tools page',
    alt: 'A shared page where a team votes on video thumbnails',
  },
  /* ---- Block 1: what a big job costs ---- */
  {
    id: 'tidewater',
    kind: 'clip',
    url: 'https://x.com/dangreenheck/status/2102878170089169235',
    capture: 'From the 3.8-minute video: 15 to 20 seconds of the island flyover, ideally ending on the dock at night',
    credit: 'Dan Greenheck, “Tidewater”, on X, Sep 2026',
    used: 'Block 1 big-job page',
    alt: 'Tidewater, a 3D island game built with an AI coding agent',
  },
  /* ---- Block 6: a method, written down ---- */
  {
    id: 'indepth',
    kind: 'image',
    url: 'https://www.nab.com.au/news/technology-ai/how-australian-small-businesses-are-using-ai-to-save-time',
    show: 'nab.com.au · How Australian small businesses are using AI to save time',
    capture: 'The Indepth Accounting section of the article, with its photo, 1600 × 1000 browser window',
    credit: 'NAB, Aug 2026',
    used: 'Block 6 method story',
    alt: 'NAB story about an accounting firm',
  },
];

export const SHOT_BY_ID: Record<string, ShotSpec> = Object.fromEntries(SHOTS.map((s) => [s.id, s]));
