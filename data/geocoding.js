import axios from "axios";

const NYC_LATITUDE_MIN = 40.45;
const NYC_LATITUDE_MAX = 40.95;
const NYC_LONGITUDE_MIN = -74.3;
const NYC_LONGITUDE_MAX = -73.65;

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
  const addressContainsBorough = address
    .split(",")
    .some(
      (addressPart) =>
        addressPart.trim().toLowerCase() === borough.toLowerCase(),
    );

  const searchQuery = addressContainsBorough
    ? `${address}, New York City, New York`
    : `${address}, ${borough}, New York City, New York`;

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: searchQuery,
          format: "jsonv2",
          addressdetails: 1,
          countrycodes: "us",
          limit: 1,
        },
        headers: {
          "User-Agent": "NeighborhoodSafetyTracker/1.0",
        },
        timeout: 5000,
      },
    );

    if (!Array.isArray(response.data) || response.data.length === 0)
      throw `Address '${searchQuery}' could not be found`;

    const location = response.data[0];

    const latitude = Number(location.lat);
    const longitude = Number(location.lon);

    if (
      latitude < NYC_LATITUDE_MIN ||
      latitude > NYC_LATITUDE_MAX ||
      longitude < NYC_LONGITUDE_MIN ||
      longitude > NYC_LONGITUDE_MAX
    ) {
      throw "Address must be located within New York City";
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude))
      throw new Error("Address service provided invalid coordinates");

    const formattedAddress = formatAddress(
      location.address || {},
      borough,
      address,
    );

    return {
      address: formattedAddress,
      latitude,
      longitude,
    };
  } catch (e) {
    if (typeof e === "string") throw e;

    if (axios.isAxiosError(e)) {
      throw new Error("The geocoding service is currently unavailable");
    }

    throw e;
  }
};
