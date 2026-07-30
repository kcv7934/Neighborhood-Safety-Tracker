const mapElement = document.getElementById("saved-location-map");

if (mapElement) {
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
  }
}
