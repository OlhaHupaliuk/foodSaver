import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

interface FoodMarkerProps {
  coordinate: { latitude: number; longitude: number };
  title: string;
  price: number;
  originalPrice: number;
  discount: number;
  onPress?: () => void;
}

export default function FoodMarker({
  coordinate,
  title,
  price,
  originalPrice,
  discount,
  onPress,
}: FoodMarkerProps) {
  return (
    <Marker coordinate={coordinate} onPress={onPress} tracksViewChanges={false}>
      <View style={styles.markerContainer}>
        <View style={styles.markerContent}>
          <Text style={styles.priceText} numberOfLines={1}>
            {price.toFixed(0)} ₴
          </Text>
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
        </View>
        <View style={styles.markerArrow} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerContent: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 60,
    alignItems: 'center',
  },
  priceText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  discountBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#10b981',
    marginTop: -2,
  },
});


