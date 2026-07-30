const mapElement = document.getElementById("saved-location-map");

const createUserReportPopup = (report, savedLocationId) => {
  const popup = document.createElement("div");

  const category = document.createElement("strong");
  category.textContent = report.category;

  const source = document.createElement("p");
  source.textContent = "User Generated Report";

  const distance = document.createElement("p");
  distance.textContent = `${report.distanceInMiles.toFixed(2)} miles away`;

  const detailsLink = document.createElement("a");
  detailsLink.href = `/user-reports/${report._id}?savedLocationId=${savedLocationId}`;
  detailsLink.textContent = "View Report";

  popup.append(category, source, distance, detailsLink);

  return popup;
};

const loadNearbyUserReports = async (map, savedLocationId) => {
  const message = document.getElementById("map-message");

  try {
    const response = await axios.get(
      `/saved-locations/${savedLocationId}/nearby-user-reports`,
    );

    const nearbyReports = response.data;

    for (const report of nearbyReports) {
      const reportCoords = [report.latitude, report.longitude];
      const reportMarker = L.circleMarker(reportCoords, {
        radius: 8,
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 0.85,
      }).addTo(map);

      const popup = createUserReportPopup(report, savedLocationId);

      reportMarker.bindPopup(popup);
    }
  } catch (error) {
    console.error(error);

    if (message) {
      message.textContent = "Nearby user reports could not be loaded";
      message.hidden = false;
    }
  }
};

if (mapElement) {
  const savedLocationId = mapElement.dataset.savedLocationId;
  const latitude = Number(mapElement.dataset.latitude);
  const longitude = Number(mapElement.dataset.longitude);
  const label = mapElement.dataset.label;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    mapElement.textContent =
      "The map could not be loaded due to invalid coordinates";
  } else {
    const center = [latitude, longitude];
    const map = L.map(mapElement).setView(center, 14);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const marker = L.marker(center).addTo(map);

    const popupContent = document.createElement("strong");
    popupContent.textContent = label;

    marker.bindPopup(popupContent).openPopup();

    const ONE_MILE_RADIUS_IN_M = 1609.344;

    const radius = L.circle(center, {
      radius: ONE_MILE_RADIUS_IN_M,
      color: "#FF0000",
      fillColor: "#DC143C",
      fillOpacity: 0.15,
    }).addTo(map);

    map.fitBounds(radius.getBounds(), {
      padding: [20, 20],
    });

    loadNearbyUserReports(map, savedLocationId);
  }
}
