/**
 * Motivation Asset Library
 *
 * Maps every task type to:
 *   - image  : SVG animal illustration (imported as a React component via react-native-svg-transformer)
 *   - quotes : array of { quote, author } motivational quotes
 *   - accent : brand color used in the card UI (border, badge, XP pill, etc.)
 *
 * Animal ↔ type mapping:
 *   🦊 Fox      → habit
 *   🐻 Bear     → workout
 *   🐰 Rabbit   → reading
 *   🦁 Lion     → task (general)
 *   🐘 Elephant → meditation
 *   🐒 Monkey   → other
 */

import FoxSvg      from '../../assets/animals/01_fox.svg';
import BearSvg     from '../../assets/animals/02_bear.svg';
import RabbitSvg   from '../../assets/animals/03_rabbit.svg';
import LionSvg     from '../../assets/animals/04_lion.svg';
import ElephantSvg from '../../assets/animals/05_elephant.svg';
import MonkeySvg   from '../../assets/animals/06_monkey.svg';

const ASSETS = {
  habit: {
    image:  FoxSvg,
    accent: '#a78bfa',
    quotes: [
      { quote: "We are what we repeatedly do.",               author: "Aristotle" },
      { quote: "Motivation gets you started. Habit keeps you going.", author: "Jim Ryun" },
      { quote: "Your habits shape your identity.",            author: "James Clear" },
      { quote: "Every time you do the hard thing, you become the person who does hard things.", author: "" },
    ],
  },

  workout: {
    image:  BearSvg,
    accent: '#86efac',
    quotes: [
      { quote: "The body achieves what the mind believes.",   author: "" },
      { quote: "No pain, no gain. Embrace the struggle.",     author: "" },
      { quote: "Train insane or remain the same.",            author: "" },
      { quote: "Your only competition is who you were yesterday.", author: "" },
    ],
  },

  reading: {
    image:  RabbitSvg,
    accent: '#fdba74',
    quotes: [
      { quote: "A reader lives a thousand lives.",            author: "George R.R. Martin" },
      { quote: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
      { quote: "The more you read, the more things you will know.", author: "Dr. Seuss" },
      { quote: "Today a reader, tomorrow a leader.",          author: "Margaret Fuller" },
    ],
  },

  task: {
    image:  LionSvg,
    accent: '#60a5fa',
    quotes: [
      { quote: "Done is better than perfect.",                author: "Sheryl Sandberg" },
      { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { quote: "One task at a time. You're already winning.", author: "" },
      { quote: "Small actions, compounded daily, change your life.", author: "" },
    ],
  },

  meditation: {
    image:  ElephantSvg,
    accent: '#67e8f9',
    quotes: [
      { quote: "Peace comes from within. Do not seek it without.", author: "Buddha" },
      { quote: "The present moment is the only moment available to us.", author: "Thich Nhat Hanh" },
      { quote: "Quiet the mind, and the soul will speak.",    author: "Ma Jaya Sati Bhagavati" },
      { quote: "In stillness, you find clarity.",             author: "" },
    ],
  },

  other: {
    image:  MonkeySvg,
    accent: '#fde68a',
    quotes: [
      { quote: "Every day is a chance to be better than yesterday.", author: "" },
      { quote: "Consistency beats intensity every time.",     author: "" },
      { quote: "Show up. Do the work. Trust the process.",   author: "" },
      { quote: "Progress, not perfection.",                   author: "" },
    ],
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** djb2-style string hash → stable positive integer */
const hashString = (str = '') => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h = h & h; // 32-bit
  }
  return Math.abs(h);
};

/**
 * Returns { image, accent, quote, author } for a feed/completed item.
 * The quote is **deterministic** — the same item._id always yields the same quote.
 * No flickering on re-renders or list scrolls.
 */
export const getAssetForItem = (item) => {
  const entry  = ASSETS[item?.type] || ASSETS.other;
  const idx    = hashString(item?._id || '') % entry.quotes.length;
  const picked = entry.quotes[idx];
  return {
    image:  entry.image,
    accent: entry.accent,
    quote:  picked.quote,
    author: picked.author,
  };
};

/**
 * Returns { image, accent, quote, author } for a pending task.
 * Uses a random quote each time — fine for pending cards since they
 * don't need cross-render stability the way feed posts do.
 */
export const getAssetForType = (taskType) => {
  const entry  = ASSETS[taskType] || ASSETS.other;
  const picked = entry.quotes[Math.floor(Math.random() * entry.quotes.length)];
  return {
    image:  entry.image,
    accent: entry.accent,
    quote:  picked.quote,
    author: picked.author,
  };
};

export default ASSETS;
