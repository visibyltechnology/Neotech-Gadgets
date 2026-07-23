const deliveryZones = {
  intrastate: {
    // Local state (Minimum threshold applied)
    states: ["Rivers"],
    price: 10000,
    duration: "5 - 6 Days"
  },
  neighboringRegional: {
    // South-South & South-East
    states: [
      "Abia", "Akwa Ibom", "Anambra", "Bayelsa", "Cross River", 
      "Delta", "Ebonyi", "Edo", "Enugu", "Imo"
    ],
    price: 12000,
    duration: "5 - 7 Days"
  },
  southWest: {
    // South-West (Your 7k Baseline)
    states: ["Ekiti", "Lagos", "Ogun", "Ondo", "Osun", "Oyo"],
    price: 14000, 
    duration: "5 - 7 Days"
  },
  middleBelt: {
    // North-Central
    states: [
      "Benue", "Federal Capital Territory", "Kogi", "Kwara", 
      "Nassarawa", "Niger", "Plateau"
    ],
    price: 16000,
    duration: "7 - 9 Days"
  },
  farNorth: {
    // North-West & North-East
    states: [
      "Adamawa", "Bauchi", "Borno", "Gombe", "Jigawa", "Kaduna", "Kano", 
      "Katsina", "Kebbi", "Sokoto", "Taraba", "Yobe", "Zamfara"
    ],
    price: 18000,
    duration: "8 - 12 Days"
  }
};

/**
 * Get delivery details based on the selected state.
 * @param {string} stateName - The name of the state (from your locations.js)
 * @returns {Object} Delivery price and duration
 */
export const getDeliveryDetails = (stateName) => {
  for (const zone in deliveryZones) {
    if (deliveryZones[zone].states.includes(stateName)) {
      return {
        price: deliveryZones[zone].price,
        duration: deliveryZones[zone].duration,
        currency: "NGN"
      };
    }
  }
  
  // Fallback default (Matches your new minimums)
  return { price: 10000, duration: "5 - 7 Days", currency: "NGN" };
};
