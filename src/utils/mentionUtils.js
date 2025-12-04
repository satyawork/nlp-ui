// src/utils/mentionUtils.js

/**
 * Find the most recent mention trigger (@ or #) before caretPos with no whitespace
 * between the trigger and caret. Returns:
 *   { trigger: '@'|'#', start, end, token }  OR null
 *
 * start = index of trigger character
 * end = caretPos (where typing stopped)
 */
export function computeMentionToken(value, caretPos) {
  const upto = value.slice(0, caretPos);
  const lastAt = upto.lastIndexOf('@');
  const lastHash = upto.lastIndexOf('#');
  const lastIdx = Math.max(lastAt, lastHash);

  if (lastIdx === -1) return null;

  const trigger = upto[lastIdx];
  const token = upto.slice(lastIdx + 1); // text after trigger up to caret

  // if token contains whitespace or newline, it's not a valid mention
  if (/\s/.test(token)) return null;

  return { trigger, start: lastIdx, end: caretPos, token };
}

/**
 * Given the current text and a mention replacement,
 * replace the mention (including the trigger) with the proper phrase:
 *   for '@' => "from collection CHOICE "
 *   for '#' => "give summary of CHOICE "
 *
 * Returns { newText, caretPosAfter } where caretPosAfter is index to set caret to.
 */
export function replaceMentionText(value, mentionRange, choice) {
  const { trigger, start, end } = mentionRange;
  // text before the trigger (exclude trigger itself)
  const before = value.slice(0, start);
  const after = value.slice(end);

  let insertion;
  if (trigger === '@') {
    insertion = `from collection ${choice}`;
  } else if (trigger === '#') {
    insertion = `give summary from ${choice}`;
  } else {
    insertion = choice;
  }

  // ensure a trailing space so subsequent typing separates words
  const newText = before + insertion + (after.startsWith(' ') ? '' : ' ') + after;

  // caret should be after the inserted phrase + single space (we added if needed)
  const caretPosAfter = before.length + insertion.length + 1;

  return { newText, caretPosAfter };
}
