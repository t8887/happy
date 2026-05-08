import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { getAssetForItem } from '../constants/motivationAssets';

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)        return 'just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} days ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Memoized — only re-renders if AnimalSvg, accent, or taskImage reference changes
const IllustrationPanel = memo(function IllustrationPanel({ AnimalSvg, accent, taskImage }) {
  const imgOpacity = useRef(new Animated.Value(0)).current;

  const onLoad = () => {
    Animated.timing(imgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  if (taskImage) {
    return (
      <Animated.Image
        source={{ uri: taskImage }}
        style={[styles.taskPhoto, { opacity: imgOpacity }]}
        onLoad={onLoad}
        resizeMode="cover"
      />
    );
  }

  return (
    <Animated.View style={[styles.illustrationPanel, { backgroundColor: accent + '12', borderColor: accent + '28', opacity: imgOpacity }]}>
      {/* Trigger fade-in once the component mounts */}
      <View onLayout={onLoad} style={styles.svgWrapper}>
        <AnimalSvg width={150} height={150} />
      </View>
    </Animated.View>
  );
});

function FeedCardInner({ item, index }) {
  const { image: AnimalSvg, accent, quote, author } = getAssetForItem(item);

  // Staggered card entry — index prop from FlatList drives the delay
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = (index || 0) * 70;
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { borderColor: accent + '30', opacity, transform: [{ translateY }] }]}>

      {/* ── Header: title + XP ── */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={[styles.xpPill, { backgroundColor: accent + '20', borderColor: accent + '50' }]}>
          <Text style={[styles.xpText, { color: accent }]}>+{item.xpAwarded} XP</Text>
        </View>
      </View>

      {/* ── Animal illustration or task photo ── */}
      <IllustrationPanel AnimalSvg={AnimalSvg} accent={accent} taskImage={item.taskImage} />

      {/* ── Motivational quote ── */}
      <View style={styles.quoteBlock}>
        <Text style={[styles.quoteMark, { color: accent + '60' }]}>"</Text>
        <Text style={styles.quoteText}>{quote}</Text>
        {!!author && <Text style={styles.quoteAuthor}>— {author}</Text>}
      </View>

      {/* ── Footer: type badge + timestamp ── */}
      <View style={[styles.footer, { borderTopColor: accent + '18' }]}>
        <View style={[styles.typeBadge, { backgroundColor: accent + '15' }]}>
          <Text style={[styles.typeBadgeText, { color: accent }]}>
            {(item.type || 'task').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.timeText}>{timeAgo(item.completedAt)}</Text>
      </View>

    </Animated.View>
  );
}

// Memoized export — FlatList won't re-render unless item._id or XP changes
const FeedCard = memo(FeedCardInner, (prev, next) =>
  prev.item._id === next.item._id &&
  prev.item.xpAwarded === next.item.xpAwarded
);
export default FeedCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111118',
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 12,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
    letterSpacing: 0.1,
  },
  xpPill: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  xpText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  // Illustration panel (SVG background)
  illustrationPanel: {
    marginHorizontal: 16,
    height: 200,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Task photo (user-uploaded)
  taskPhoto: {
    marginHorizontal: 16,
    height: 200,
    borderRadius: 20,
    marginBottom: 16,
  },

  // Quote
  quoteBlock: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  quoteMark: {
    fontSize: 36,
    lineHeight: 24,
    marginBottom: 4,
    fontWeight: '800',
  },
  quoteText: {
    color: '#bbb',
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    color: '#555',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'normal',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  typeBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  timeText: { color: '#444', fontSize: 12 },
});

