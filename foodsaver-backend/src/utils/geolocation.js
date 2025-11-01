// функція для обчислення відстані між двома точками (в км)
exports.calculateDistance = (coords1, coords2) => {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

const toRad = (value) => {
  return (value * Math.PI) / 180;
};

// функція для пошуку об'єктів в радіусі (MongoDB geospatial query)
exports.findNearby = async (Model, longitude, latitude, maxDistance = 5000) => {
  return await Model.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance, // в метрах
      },
    },
  });
};
// utils/geolocation.js
const axios = require("axios");

/**
 * Витягує координати з Google Maps посилання
 * Приклади посилань:
 * https://maps.google.com/?q=50.4501,30.5234
 * https://goo.gl/maps/ABC123
 * https://www.google.com/maps/place/50.4501,30.5234
 */
const extractCoordinatesFromMapsLink = (mapsLink) => {
  try {
    // Паттерн для координат у посиланні
    const coordPattern = /(?:q=|place\/)(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const match = mapsLink.match(coordPattern);

    if (match) {
      const latitude = parseFloat(match[1]);
      const longitude = parseFloat(match[2]);

      // Валідація координат
      if (
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      ) {
        return [longitude, latitude]; // MongoDB формат: [longitude, latitude]
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting coordinates:", error);
    return null;
  }
};

/**
 * Геокодування адреси через Google Geocoding API
 */
const geocodeAddress = async (address) => {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: address,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return [location.lng, location.lat]; // MongoDB формат
    }

    return null;
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
};

module.exports = {
  extractCoordinatesFromMapsLink,
  geocodeAddress,
};
