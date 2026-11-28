/*
 * Replies shown in the deck that were copied word for word from a real run in the app named.
 * Never write or edit a reply here by hand: run the prompt again and paste what comes back.
 * The businesses and figures in the prompts are made up.
 */
export type RealRun = { app: 'ChatGPT' | 'Claude'; model: string; captured: string; reply: string[] };

/* Block 2, "Three jobs, three places", the Chat job. A string starting with "- " is a bullet. */
export const TALK_PROMPT = 'Rewrite this so it sounds less stiff: “Please find attached our quotation for the works as discussed.”';
export const TALK: Record<'L' | 'R', RealRun> = {
  L: {
    app: 'ChatGPT',
    model: 'Thinking · Extra High',
    captured: '2026-11-24',
    reply: ["I've attached our quote for the works we discussed."],
  },
  R: {
    app: 'Claude',
    model: 'Fable 5.2 · Medium',
    captured: '2026-11-24',
    reply: [
      'Options, from lightly relaxed to casual:',
      '- “I’ve attached our quote for the work we discussed.”',
      '- “Here’s our quote for the job we talked about.”',
      '- “Attached is the quote for the work we went over. Let me know if you have any questions.”',
      'The stiffness comes from three things: “please find attached” (a holdover from letter-era commercial correspondence, like “enclosed please find”), “quotation” where “quote” is standard in speech, and “the works”, which is contract-drafting register. If the recipient is a contracts administrator or the quote references a formal scope, keep “the works” and just fix the opening: “I’ve attached our quotation for the works as discussed.”',
    ],
  },
};

/*
 * Block 2, "A photo becomes a spreadsheet". Colin ran these himself on 2026-11-28 with the made-up
 * Baldivis sign-in sheet attached (ChatGPT temporary chat, Claude incognito chat), and sent screenshots.
 * Copied from the screenshots word for word. In `before` and `after`, a string starting with "- " is a
 * bullet, "\n" is a line break, and **x** is bold as the app showed it. `table` is the pasteable block.
 */
export const PHOTO_PROMPT = "Turn this into a table I can paste into Excel. Flag anything you can't read.";
export type PhotoRun = RealRun & { table: string[][]; flag: [number, number]; before: string[]; after: string[] };
export const PHOTO: Record<'L' | 'R', PhotoRun> = {
  L: {
    app: 'ChatGPT',
    model: 'Temporary chat',
    captured: '2026-11-28',
    reply: [],
    before: [
      '**Toolbox Talk – Sign-in Sheet**\nSite: Lot 14, Baldivis\nDate: Tue 4 Nov (year not specified)',
      'Copy the tab-separated table below and paste directly into Excel starting at cell A1.',
    ],
    table: [
      ['Name', 'Company', 'Mobile', 'Time In', 'Signed', 'Notes'],
      ['Jess Tran', 'Ridgeline', '0491 570 156', '6:52', 'Yes', ''],
      ["Mick O'Brien", 'Westside Elec.', '0491 570 313', '6:58', 'Yes', ''],
      ['Priya Nair', 'Ridgeline', '0491 571 266', '7:05', 'Yes', 'Mobile number slightly smudged – verify'],
      ['Dave Kowalski', 'Northline', '0491 572 549', '7:11', 'Yes', ''],
      ['Sam Ho', 'Coastal Plumbing', '0491 573 770', '7:15', 'Yes', ''],
    ],
    flag: [3, 5],
    after: [
      '**Items flagged for verification:**',
      '- Priya Nair – the second-last digit of the mobile number is slightly smudged but appears to be a 6.',
      '- Date – no year is visible on the sheet.',
      'All other entries are legible. All five attendees have a signature present.',
      '**Excel tip:** Format the Mobile column as Text to ensure the leading zeros are retained.',
    ],
  },
  R: {
    app: 'Claude',
    model: 'Incognito chat',
    captured: '2026-11-28',
    reply: [],
    before: ['Copy the block below and paste it into cell A1. The columns are tab-separated, so they’ll split into cells.'],
    table: [
      ['Site', 'Date', 'Name', 'Company', 'Mobile', 'Time In', 'Signed'],
      ['Lot 14, Baldivis', 'Tue 4 Nov', 'Jess Tran', 'Ridgeline', '0491 570 156', '6:52', 'Y'],
      ['Lot 14, Baldivis', 'Tue 4 Nov', "Mick O'Brien", 'Westside Elec.', '0491 570 313', '6:58', 'Y'],
      ['Lot 14, Baldivis', 'Tue 4 Nov', 'Priya Nair', 'Ridgeline', '0491 571 2?6', '7:05', 'Y'],
      ['Lot 14, Baldivis', 'Tue 4 Nov', 'Dave Kowalski', 'Northline', '0491 572 549', '7:11', 'Y'],
      ['Lot 14, Baldivis', 'Tue 4 Nov', 'Sam Ho', 'Coastal Plumbing', '0491 573 770', '7:15', 'Y'],
    ],
    flag: [3, 4],
    after: [
      '**Flags:**',
      '- **Priya Nair’s mobile:** An ink blot covers the second-last digit. It looks most like a 6, which would make the number 0491 571 266, but I can’t confirm it. I’ve marked it with `?`.',
      '- **Date:** 4 Nov 2026 falls on a Wednesday. The sheet says Tuesday, so it’s probably from 2025, or the day was written wrong. I left the year off.',
      '- **Westside Elec.** is abbreviated on the sheet, so I kept it as written.',
      'The spaces in the mobile numbers make Excel treat them as text, so the leading zeros stay. If you strip the spaces, format the column as Text first.',
    ],
  },
};
