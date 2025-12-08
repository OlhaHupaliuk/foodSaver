import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  showLabel?: boolean;
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  size = 20, 
  readonly = false,
  showLabel = false 
}: StarRatingProps) {
  const { theme } = useTheme();
  const [hoveredRating, setHoveredRating] = React.useState(0);

  const displayRating = hoveredRating || rating || 0;

  const handlePress = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((value) => (
          <TouchableOpacity
            key={value}
            onPress={() => handlePress(value)}
            onPressIn={() => !readonly && setHoveredRating(value)}
            onPressOut={() => !readonly && setHoveredRating(0)}
            disabled={readonly || !onRatingChange}
            activeOpacity={readonly ? 1 : 0.7}
            style={styles.starButton}
          >
            <Star
              size={size}
              color={value <= displayRating ? '#FBBF24' : theme.colors.surfaceTertiary}
              fill={value <= displayRating ? '#FBBF24' : 'none'}
            />
          </TouchableOpacity>
        ))}
      </View>
      {showLabel && (
        <View style={styles.labelContainer}>
          {displayRating > 0 && (
            <View style={styles.ratingTextContainer}>
              <View style={[styles.ratingBadge, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <Star size={12} color="#FBBF24" fill="#FBBF24" />
                <Text style={[styles.ratingText, { color: theme.colors.text }]}>
                  {displayRating.toFixed(1)}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  starButton: {
    padding: 2,
  },
  labelContainer: {
    marginLeft: 8,
  },
  ratingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

