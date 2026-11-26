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
