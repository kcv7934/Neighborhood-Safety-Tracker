import axios from "axios";

const formatAddress = (addressDetails, borough, originalAddress) => {
  const houseNumber = addressDetails.house_number || "";

  const street =
    addressDetails.road ||
    addressDetails.pedestrian ||
    addressDetails.footway ||
    "";

  const postcode = addressDetails.postcode || "";

  const streetAddress = `${houseNumber} ${street}`.trim();

  const addressParts = [];

  if (streetAddress) {
    addressParts.push(streetAddress);
  } else {
    addressParts.push(originalAddress);
  }

  addressParts.push(borough);

  if (postcode) {
    addressParts.push(`NY ${postcode}`);
  } else {
    addressParts.push("NY");
  }

  return addressParts.join(", ");
};

export const geocodeAddress = async (address, borough) => {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: `${address}, ${borough}, New York City, New York`,
          format: "jsonv2",
          addressdetails: 1,
          countrycodes: "us",
          limit: 1,
        },
        headers: {
          "User-Agent": "NeighborhoodSafetyTracker/1.0",
        },
      },
    );

    if (!Array.isArray(response.data) || response.data.length === 0)
      throw `Address '${address}, ${borough}, New York City, New York' could not be found`;

    const location = response.data[0];

    const latitude = Number(location.lat);
    const longitude = Number(location.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude))
      throw "Address service provided invalid coordinates";

    const formattedAddress = formatAddress(location.address || {}, borough, address);

    return {
      address: formattedAddress,
      latitude,
      longitude,
    };
  } catch (e) {
    if (typeof e === "string") throw e;

    throw "Could not connect to geocode service";
  }
};
