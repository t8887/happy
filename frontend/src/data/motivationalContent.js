/**
 * Motivational Content Library
 *
 * Each task type has:
 *   - visual: config for the animated card visual (colors, emoji, pulse)
 *   - quotes: array of { quote, author } — one is picked randomly at display time
 *
 * No external assets required — visuals are rendered as animated RN components.
 */

export const MOTIVATIONAL_CONTENT = {
  task: {
    visual: {
      gradientStart: '#1a1f3a',
      gradientEnd:   '#0f0f1a',
      accent:        '#60a5fa',
      emoji:         '✅',
      pulseColor:    '#60a5fa22',
    },
    quotes: [
      { quote: "Done is better than perfect.", author: "Sheryl Sandberg" },
      { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { quote: "One task at a time. You're already winning.", author: "" },
      { quote: "Small actions, compounded daily, change your life.", author: "" },
    ],
  },

  habit: {
    visual: {
      gradientStart: '#1e1a3a',
      gradientEnd:   '#0f0f1a',
      accent:        '#a78bfa',
      emoji:         '🔁',
      pulseColor:    '#a78bfa22',
    },
    quotes: [
      { quote: "We are what we repeatedly do.", author: "Aristotle" },
      { quote: "Motivation gets you started. Habit keeps you going.", author: "Jim Ryun" },
      { quote: "Your habits shape your identity.", author: "James Clear" },
      { quote: "Every time you do the hard thing, you become the person who does hard things.", author: "" },
    ],
  },

  workout: {
    visual: {
      gradientStart: '#1f2a1a',
      gradientEnd:   '#0f0f1a',
      accent:        '#86efac',
      emoji:         '💪',
      pulseColor:    '#86efac22',
    },
    quotes: [
      { quote: "The body achieves what the mind believes.", author: "" },
      { quote: "No pain, no gain. Embrace the struggle.", author: "" },
      { quote: "Train insane or remain the same.", author: "" },
      { quote: "Your only competition is who you were yesterday.", author: "" },
    ],
  },

  reading: {
    visual: {
      gradientStart: '#2a1f1a',
      gradientEnd:   '#0f0f1a',
      accent:        '#fdba74',
      emoji:         '📚',
      pulseColor:    '#fdba7422',
    },
    quotes: [
      { quote: "A reader lives a thousand lives.", author: "George R.R. Martin" },
      { quote: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
      { quote: "The more you read, the more things you will know.", author: "Dr. Seuss" },
      { quote: "Today a reader, tomorrow a leader.", author: "Margaret Fuller" },
    ],
  },

  meditation: {
    visual: {
      gradientStart: '#1a2a2a',
      gradientEnd:   '#0f0f1a',
      accent:        '#67e8f9',
      emoji:         '🧘',
      pulseColor:    '#67e8f922',
    },
    quotes: [
      { quote: "Peace comes from within. Do not seek it without.", author: "Buddha" },
      { quote: "The present moment is the only moment available to us.", author: "Thich Nhat Hanh" },
      { quote: "Quiet the mind, and the soul will speak.", author: "Ma Jaya Sati Bhagavati" },
      { quote: "In stillness, you find clarity.", author: "" },
    ],
  },

  other: {
    visual: {
      gradientStart: '#2a2a1a',
      gradientEnd:   '#0f0f1a',
      accent:        '#fde68a',
      emoji:         '⚡',
      pulseColor:    '#fde68a22',
    },
    quotes: [
      { quote: "Every day is a chance to be better than yesterday.", author: "" },
      { quote: "Consistency beats intensity every time.", author: "" },
      { quote: "Show up. Do the work. Trust the process.", author: "" },
      { quote: "Progress, not perfection.", author: "" },
    ],
  },
};

/**
 * Get a random motivational entry for a given task type.
 * Returns { visual, quote, author }
 */
export const getMotivation = (taskType) => {
  const content = MOTIVATIONAL_CONTENT[taskType] || MOTIVATIONAL_CONTENT.other;
  const quotes = content.quotes;
  const picked = quotes[Math.floor(Math.random() * quotes.length)];
  return {
    visual: content.visual,
    quote: picked.quote,
    author: picked.author,
  };
};

/**
 * Simple djb2-style string hash → positive integer.
 * Used to make quote selection deterministic per feed item.
 */
const hashString = (str = '') => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // convert to 32-bit int
  }
  return Math.abs(hash);
};

/**
 * Returns a stable { visual, quote, author } for a feed item.
 * The same item._id always maps to the same quote — stable across re-renders.
 */
export const getMotivationForItem = (item) => {
  const content = MOTIVATIONAL_CONTENT[item?.type] || MOTIVATIONAL_CONTENT.other;
  const quotes = content.quotes;
  const idx = hashString(item?._id || '') % quotes.length;
  return {
    visual: content.visual,
    quote: quotes[idx].quote,
    author: quotes[idx].author,
  };
};
