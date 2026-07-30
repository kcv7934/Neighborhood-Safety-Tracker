const EARTH_RADIUS_IN_MILES = 3958.8;

const convertDegreesToRadians = (deg) => {
  return deg * (Math.PI / 180);
};

export const findDistanceBetweenInMiles = (
  latitude1,
  longitude1,
  latitude2,
  longitude2,
) => {
  const latitudeDelta = convertDegreesToRadians(latitude2 - latitude1);

  const longitudeDelta = convertDegreesToRadians(longitude2 - longitude1);

  const lat1 = convertDegreesToRadians(latitude1);
  const lat2 = convertDegreesToRadians(latitude2);

  // Haversine formula
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(longitudeDelta / 2) ** 2;

  const c = 2 * Math.asin(Math.sqrt(a));

  return EARTH_RADIUS_IN_MILES * c;
};
