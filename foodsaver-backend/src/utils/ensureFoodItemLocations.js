const FoodItem = require("../models/FoodItem");
const Restaurant = require("../models/Restaurant");

const DEFAULT_LOCATION = [24.0297, 49.8397]; // [longitude, latitude]

const missingLocationQuery = {
  $or: [
    { location: { $exists: false } },
    { "location.coordinates": { $exists: false } },
    { "location.coordinates": { $size: 0 } },
  ],
};

const ensureFoodItemLocations = async () => {
  try {
    const items = await FoodItem.find(missingLocationQuery).select(
      "_id restaurant"
    );

    if (!items.length) {
      return;
    }

    const restaurantIds = [
      ...new Set(
        items
          .filter((item) => item.restaurant)
          .map((item) => item.restaurant.toString())
      ),
    ];

    const restaurants = await Restaurant.find({
      _id: { $in: restaurantIds },
    }).select("location");

    const restaurantLocationsMap = new Map();
    restaurants.forEach((restaurant) => {
      if (
        restaurant.location &&
        Array.isArray(restaurant.location.coordinates) &&
        restaurant.location.coordinates.length === 2
      ) {
        restaurantLocationsMap.set(
          restaurant._id.toString(),
          restaurant.location.coordinates
        );
      }
    });

    await Promise.all(
      items.map((item) => {
        const restaurantCoords = restaurantLocationsMap.get(
          item.restaurant?.toString()
        );

        const coordinates = restaurantCoords || DEFAULT_LOCATION;

        return FoodItem.updateOne(
          { _id: item._id },
          {
            location: {
              type: "Point",
              coordinates,
            },
          }
        );
      })
    );

    console.log(
      `Ensured location for ${items.length} food items lacking coordinates`
    );
  } catch (error) {
    console.error("Failed to ensure food item locations:", error.message);
  }
};

module.exports = {
  ensureFoodItemLocations,
  missingLocationQuery,
};

