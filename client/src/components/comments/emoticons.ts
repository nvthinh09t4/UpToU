/**
 * Yahoo Messenger–style emoticon map.
 * Keys are text shortcuts; values are emoji characters.
 */
export interface Emoticon {
  shortcut: string;
  emoji: string;
  label: string;
}

export const EMOTICONS: Emoticon[] = [
  { shortcut: ':)', emoji: '😊', label: 'Smile' },
  { shortcut: ':(', emoji: '😞', label: 'Sad' },
  { shortcut: ':D', emoji: '😃', label: 'Big grin' },
  { shortcut: ';)', emoji: '😉', label: 'Wink' },
  { shortcut: ':P', emoji: '😛', label: 'Tongue out' },
  { shortcut: ':O', emoji: '😮', label: 'Surprised' },
  { shortcut: 'XD', emoji: '🤣', label: 'Laughing' },
  { shortcut: ':*', emoji: '😘', label: 'Kiss' },
  { shortcut: 'B)', emoji: '😎', label: 'Cool' },
  { shortcut: ":'(", emoji: '😢', label: 'Crying' },
  { shortcut: ':/', emoji: '😕', label: 'Confused' },
  { shortcut: '>:(', emoji: '😠', label: 'Angry' },
  { shortcut: ':3', emoji: '😺', label: 'Cat face' },
  { shortcut: '<3', emoji: '❤️', label: 'Heart' },
  { shortcut: 'O:)', emoji: '😇', label: 'Angel' },
  { shortcut: ':$', emoji: '😳', label: 'Blushing' },
  { shortcut: ':|', emoji: '😐', label: 'Straight face' },
  { shortcut: '>:)', emoji: '😈', label: 'Devil' },
  { shortcut: '(Y)', emoji: '👍', label: 'Thumbs up' },
  { shortcut: '(N)', emoji: '👎', label: 'Thumbs down' },
  { shortcut: '(H)', emoji: '🤗', label: 'Hug' },
  { shortcut: ':@', emoji: '🤬', label: 'Swearing' },
  { shortcut: '#:)', emoji: '🥳', label: 'Party' },
  { shortcut: '(F)', emoji: '🌸', label: 'Flower' },
];

/**
 * Build a regex that matches any emoticon shortcut.
 * Shortcuts are escaped and sorted longest-first so longer patterns match first.
 */
function buildEmoticonRegex(): RegExp {
  const escaped = EMOTICONS
    .map((e) => e.shortcut)
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(${escaped.join('|')})`, 'g');
}

export const EMOTICON_REGEX = buildEmoticonRegex();

/** Build a map from shortcut → emoji for fast lookup. */
const SHORTCUT_MAP = new Map(EMOTICONS.map((e) => [e.shortcut, e.emoji]));

/** Replace all text shortcuts with their emoji equivalents. */
export function replaceEmoticons(text: string): string {
  return text.replace(EMOTICON_REGEX, (match) => SHORTCUT_MAP.get(match) ?? match);
}
