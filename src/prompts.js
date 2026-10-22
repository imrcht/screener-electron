// Feature definitions: each mode picks which inputs to attach and how to prompt.
// ctx = { transcript: [{channel:'you'|'them', text}], userText }

function formatTranscript(turns, limit) {
  const recent = limit ? turns.slice(-limit) : turns;
  return recent.map((t) => (t.channel === 'them' ? 'Them: ' : 'You: ') + t.text).join('\n');
}

const MODES = {
  // One-shot "do the smart thing". Uses screen + recent transcript.
  assist: {
    needsScreen: true,
    userBubble: null,
    small: false,
    system:
      'You are cue, a discreet real-time copilot overlaid on the user\'s screen during a call or coding session. ' +
      'Look at the screenshot and the recent conversation, decide what the user needs RIGHT NOW, and deliver it directly with no preamble. ' +
      'If the screen shows a coding/LeetCode problem: give a short approach, then a correct solution in a fenced code block, then time and space complexity. ' +
      'If it is a conversation: answer the current question or say exactly what the user should say next, in the first person. ' +
      'Be concise and confident. Never say "I can see" or describe the screenshot.',
    build(ctx) {
      const t = formatTranscript(ctx.transcript, 12);
      return 'Recent conversation:\n' + (t || '(none)') + '\n\nRespond with what I need right now.';
    }
  },

  // Smart interview & conversation reply. Uses screen + transcript + résumé context.
  say: {
    needsScreen: true,
    userBubble: 'How should I respond?',
    small: false,
    system:
      'You are cue, whispering suggested replies to the user during a live interview or conversation. ' +
      'Look at what is shown on screen and what was said in the conversation. ' +
      'Draft ONE short, natural, confident reply the user can say out loud in the first person. ' +
      'Keep it direct, professional, and grounded in the user\'s background. 1–3 sentences, no quotes, no preamble.',
    build(ctx) {
      const t = formatTranscript(ctx.transcript, 14);
      return (t ? 'Conversation so far:\n' + t + '\n\n' : '') +
        'Based on the screen and conversation, draft what I should say next.';
    }
  },

  // Instant code and error debugger.
  debug: {
    needsScreen: true,
    userBubble: 'Debug & explain screen',
    small: false,
    system:
      'You are a senior software engineer. The screenshot shows code, an error message, a stack trace, or a technical diagram. ' +
      'Analyze what is on screen and deliver: (1) a concise explanation of what is happening or why it failed, ' +
      '(2) the exact fix or corrected code block, (3) any key edge case or takeaway. Be direct and technical with no fluff.',
    build() {
      return 'Debug the code, error, or system shown in the screenshot. Explain what is happening and provide the fix.';
    }
  },

  // Smart follow-up questions (optional/legacy).
  followup: {
    needsScreen: false,
    userBubble: 'Follow-up questions',
    small: true,
    system:
      'You are cue. Given the conversation, suggest 2–4 sharp, relevant follow-up questions the user could ask next ' +
      'to sound engaged and drive the discussion. Return them as a short bullet list, nothing else.',
    build(ctx) {
      const t = formatTranscript(ctx.transcript, 20);
      return 'Conversation so far:\n' + (t || '(none)') + '\n\nSuggest follow-up questions.';
    }
  },

  // Recap of the whole session (optional/legacy).
  recap: {
    needsScreen: false,
    userBubble: 'Recap',
    small: true,
    system:
      'You are cue. Summarize the conversation so far for someone who joined late: ' +
      'a few key points, any decisions, and action items. Use short bullets under bold headers. Be brief.',
    build(ctx) {
      const t = formatTranscript(ctx.transcript, 0);
      return 'Full transcript:\n' + (t || '(nothing captured yet)') + '\n\nRecap this.';
    }
  },

  // Free-form question typed in the composer. All three inputs as context.
  ask: {
    needsScreen: true,
    userBubble: null, // uses the typed text as the bubble
    small: false,
    system:
      'You are cue, a real-time copilot with access to the user\'s screen and live conversation. ' +
      'Answer the user\'s question directly and concisely, grounded in what is on screen and what was said. No preamble.',
    build(ctx) {
      const t = formatTranscript(ctx.transcript, 12);
      return (t ? 'Recent conversation:\n' + t + '\n\n' : '') + 'Question: ' + ctx.userText;
    }
  },

  // Explicit LeetCode/coding screenshot solver (Cmd+H). Screen only.
  leetcode: {
    needsScreen: true,
    userBubble: 'Solve what\'s on screen',
    small: false,
    system:
      'You are an expert competitive programmer. The screenshot contains a coding problem. ' +
      'Respond with: (1) a one-line restatement, (2) a short approach, (3) a clean, correct, idiomatic solution in a fenced code block ' +
      '(use the language shown on screen, else Python), (4) time and space complexity.',
    build() { return 'Solve the coding problem shown in the screenshot.'; }
  }
};

module.exports = { MODES, formatTranscript };
