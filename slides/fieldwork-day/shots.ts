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
  /** Small label on the shot itself, e.g. when a clip is a vendor demo rather than the business's own screen. */
  note?: string;
};

export const SHOTS: ShotSpec[] = [
  /* ---- Block 1: real owners, real jobs ---- */
  {
    id: 'wcd-1',
    kind: 'image',
    url: 'https://pbs.twimg.com/media/HUEgJtkasAAmQhF.jpg?name=orig',
    capture: 'Photo 1 of 4 from the West Coast Deck post: the tape measure on site',
    credit: 'Jameson Haslam, West Coast Deck, on X, Oct 2026',
    used: 'Block 1 owners page',
    alt: 'Photo from the West Coast Deck post',
  },
  {
    id: 'wcd-2',
    kind: 'image',
    url: 'https://pbs.twimg.com/media/HUEgJtkbcAA2e_Y.jpg?name=orig',
    capture: 'Photo 2 of 4 from the West Coast Deck post: the ChatGPT prompt with the site-visit transcript',
    credit: 'Jameson Haslam, West Coast Deck, on X, Oct 2026',
    used: 'Block 3 deck-builder story',
    alt: 'Photo from the West Coast Deck post',
  },
  {
    id: 'wcd-3',
    kind: 'image',
    url: 'https://pbs.twimg.com/media/HUEgJtkaUAAZzNr.jpg?name=orig',
    capture: 'Photo 3 of 4 from the West Coast Deck post: the list of recorded site visits',
    credit: 'Jameson Haslam, West Coast Deck, on X, Oct 2026',
    used: 'Block 3 deck-builder story',
    alt: 'Photo from the West Coast Deck post',
  },
  {
    id: 'wcd-4',
    kind: 'image',
    url: 'https://pbs.twimg.com/media/HUEgiY5a4AA4hiD.jpg?name=orig',
    capture: 'Photo 4 of 4 from the West Coast Deck post: the drafted scope of work',
    credit: 'Jameson Haslam, West Coast Deck, on X, Oct 2026',
    used: 'Block 3 deck-builder story',
    alt: 'Photo from the West Coast Deck post',
  },
  {
    id: 'oakcreek',
    kind: 'image',
    url: 'https://www.wral.com/your-plumber-has-a-new-favorite-tool-chatgpt/22193477/',
    show: 'wral.com · CNN · “Your plumber has a new favorite tool: ChatGPT”',
    capture: 'The story page headline and first paragraphs, 1600 × 1000 browser window (cropped, ad removed)',
    credit: 'Bryan Mena, CNN, Oct 2025',
    used: 'Block 1 owners page',
    alt: 'News story about plumbers using ChatGPT',
  },
  {
    id: 'mothership',
    kind: 'clip',
    url: 'https://youtu.be/yxeHQvby5JY',
    capture: 'The Monday brief on screen: 10 to 15 seconds where the finished brief is readable',
    credit: 'Anthropic, Claude for Small Business “Monday brief” demo video (sample company), Sep 2026',
    used: 'Block 1 owners page',
    alt: 'Claude’s Monday brief workflow, in Anthropic’s demo',
    note: 'Anthropic demo · sample company',
  },
  {
    id: 'hireeffect',
    kind: 'clip',
    url: 'https://youtu.be/sD1_ERv4nDM',
    capture: 'The month-end close: 10 to 15 seconds where the flagged transactions are on screen',
    credit: 'Anthropic, Claude for Small Business “Close the month” demo video (sample company), Sep 2026',
    used: 'Block 1 owners page',
    alt: 'Claude’s month-end close workflow, in Anthropic’s demo',
    note: 'Anthropic demo · sample company',
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
    capture: 'The “Speed to lead” demo: 10 to 15 seconds where a new lead gets its reply and the CRM record updates',
    credit: 'Anthropic, Claude for Small Business “Speed to lead” demo video (sample company), Sep 2026',
    used: 'Block 4 real-tools page',
    alt: 'Claude’s speed-to-lead workflow, in Anthropic’s demo',
    note: 'Anthropic demo · sample company',
  },
  {
    id: 'kane',
    kind: 'clip',
    url: 'https://youtu.be/ZV3oKch1t_I',
    capture: 'The proposal builder: 10 to 15 seconds where the drafted proposal or statement of work is on screen',
    credit: 'Anthropic, Claude for Small Business “Proposal builder” demo video (sample company), Sep 2026',
    used: 'Block 4 real-tools page',
    alt: 'Claude’s proposal-builder workflow, in Anthropic’s demo',
    note: 'Anthropic demo · sample company',
  },
  {
    id: 'packlab',
    kind: 'clip',
    url: 'https://youtu.be/OuC6eIiAta0',
    capture: 'The “packaging lab” section: 10 to 15 seconds of the team voting on thumbnails',
    credit: 'Anthony Dupont-Cinko, “How to Use Claude Artifacts (Beginner to Pro)”, Tenex on YouTube, Sep 2026',
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
  /* ---- Block 1: a farmer's own software ---- */
  {
    id: 'cutsheetrx',
    kind: 'clip',
    url: 'https://x.com/traviss22/status/2118375285917884898',
    show: 'senterfarms.com/programs/csrx · CutSheetRX',
    capture: 'Clip 1 from the thread: draw a field, cut and fill, then the 3D water-flow view (supplied by Colin, 6 Nov 2026)',
    credit: 'Travis Senter, Senter Farms, on X, Nov 2026',
    used: 'Block 1 farmer page',
    alt: 'CutSheetRX: a field drawn on a map, its cut and fill, and a 3D view of where rain will flow',
  },
  {
    id: 'cutsheetrx-phone',
    kind: 'clip',
    url: 'https://x.com/traviss22/status/2118417086200655952',
    capture: 'Clip 3 from the thread: the elevation profile on a phone (supplied by Colin, 6 Nov 2026)',
    credit: 'Travis Senter, Senter Farms, on X, Nov 2026',
    used: 'Block 1 farmer page',
    alt: 'CutSheetRX on a phone, drawing an elevation profile',
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
