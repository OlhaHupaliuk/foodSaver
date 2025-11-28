import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationResult {
  granted: boolean;
  coords?: Coordinates;
  error?: string;
}

const DEFAULT_COORDINATES: Coordinates = {
  latitude: 49.8397,
  longitude: 24.0297,
};

export async function getUserLocation(): Promise<LocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        granted: false,
        coords: DEFAULT_COORDINATES,
        error: 'Доступ до геолокації заборонено',
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      granted: true,
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
    };
  } catch (error) {
    console.error('Location error', error);
    return {
      granted: false,
      coords: DEFAULT_COORDINATES,
      error: 'Не вдалося отримати геолокацію',
    };
  }
}

export function getDefaultCoordinates(): Coordinates {
  return DEFAULT_COORDINATES;
}

