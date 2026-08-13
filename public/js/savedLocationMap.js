const mapElement = document.getElementById("saved-location-map");
const filterForm = document.getElementById("nearby-report-filter-form");
const clearFiltersButton = document.getElementById("clear-report-filters");

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

const loadNearbyUserReports = async (
  savedLocationId,
  reportLayer,
  filters = {},
) => {
  const message = document.getElementById("map-message");

  message.hidden = true;
  message.textContent = "";

  reportLayer.clearLayers();

  try {
    const response = await axios.get(
      `/saved-locations/${savedLocationId}/nearby-user-reports`,
      {
        params: filters,
      },
    );

    const nearbyReports = response.data;

    if (nearbyReports.length === 0) {
      let hasFilters = false;

      if (filters.category) {
        hasFilters = true;
      } else if (filters.startDate) {
        hasFilters = true;
      } else if (filters.endDate) {
        hasFilters = true;
      }

      if (hasFilters) {
        message.textContent =
          "No nearby user reports match the selected filters";
      } else {
        message.textContent = "No nearby user reports found within 1 mile";
      }

      message.hidden = false;
      return;
    }

    for (const report of nearbyReports) {
      const reportCoords = [report.latitude, report.longitude];
      const reportMarker = L.circleMarker(reportCoords, {
        radius: 8,
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 0.85,
      }).addTo(reportLayer);

      const popup = createUserReportPopup(report, savedLocationId);

      reportMarker.bindPopup(popup);
    }
  } catch (error) {
    console.error(error);

    if (error.response?.data?.error) {
      message.textContent = error.response.data.error;
    } else {
      message.textContent = "Nearby user reports could not be loaded";
    }

    message.hidden = false;
  }
};

const setupReportFilters = (savedLocationId, userReportLayer) => {
  if (!filterForm) return;

  filterForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const category = filterForm.elements.category.value.trim();
    const startDate = filterForm.elements.startDate.value.trim();
    const endDate = filterForm.elements.endDate.value.trim();

    const message = document.getElementById("map-message");

    if (startDate !== "" && endDate !== "" && startDate > endDate) {
      message.textContent = "Start date cannot be after end date";
      message.hidden = false;
      return;
    }

    const filters = {
      category,
      startDate,
      endDate,
    };

    await loadNearbyUserReports(savedLocationId, userReportLayer, filters);
  });

  if (clearFiltersButton) {
    clearFiltersButton.addEventListener("click", async () => {
      filterForm.reset();
      await loadNearbyUserReports(savedLocationId, userReportLayer);
    });
  }
};

const initializeSavedLocationMap = (element) => {
  const savedLocationId = element.dataset.savedLocationId;

  const latitude = Number(element.dataset.latitude);
  const longitude = Number(element.dataset.longitude);
  const label = element.dataset.label;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    element.textContent =
      "The map could not be loaded due to invalid coordinates";
    return;
  }

  const center = [latitude, longitude];

  const map = L.map(element).setView(center, 14);

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

  const userReportLayer = L.layerGroup().addTo(map);

  loadNearbyUserReports(savedLocationId, userReportLayer);

  setupReportFilters(savedLocationId, userReportLayer);
};

if (mapElement) {
  initializeSavedLocationMap(mapElement);
}
