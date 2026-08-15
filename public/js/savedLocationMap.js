const mapElement = document.getElementById("saved-location-map");
const filterForm = document.getElementById("nearby-report-filter-form");
const clearFiltersButton = document.getElementById("clear-report-filters");

const createUserReportPopup = (report) => {
  const popup = document.createElement("div");

  const category = document.createElement("strong");
  category.textContent = report.category;

  const source = document.createElement("p");
  source.textContent = "User Generated Report";

  const distance = document.createElement("p");
  distance.textContent = `${report.distanceInMiles.toFixed(2)} miles away`;

  const detailsLink = document.createElement("a");
  detailsLink.href = `/user-reports/${report._id}`;
  detailsLink.textContent = "View Report";

  popup.append(category, source, distance, detailsLink);

  return popup;
};

const createOfficialReportPopup = (report) => {
  const popup = document.createElement("div");

  const category = document.createElement("strong");
  category.textContent = report.category;

  const source = document.createElement("p");
  source.textContent = "Official NYPD Report";

  const crimeType = document.createElement("p");
  crimeType.textContent = report.crimeType;

  const distance = document.createElement("p");
  distance.textContent = `${report.distanceInMiles.toFixed(2)} miles away`;

  const detailsLink = document.createElement("a");
  detailsLink.href = `/official-reports/${report._id}`;
  detailsLink.textContent = "View Report";

  popup.append(category, source, crimeType, distance, detailsLink);

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

    for (const report of nearbyReports) {
      const reportCoords = [report.latitude, report.longitude];
      const reportMarker = L.circleMarker(reportCoords, {
        radius: 6,
        color: "#1d4ed8",
        fillColor: "#3b82f6",
        weight: 2,
        fillOpacity: 0.8,
      }).addTo(reportLayer);

      const popup = createUserReportPopup(report);

      reportMarker.bindPopup(popup);
    }
    return nearbyReports;
  } catch (error) {
    console.error(error);

    if (error.response && error.response.data && error.response.data.error) {
      message.textContent = error.response.data.error;
    } else {
      message.textContent = "Nearby user reports could not be loaded";
    }

    message.hidden = false;

    return [];
  }
};

const loadNearbyOfficialReports = async (
  savedLocationId,
  officialReportLayer,
  filters = {},
) => {
  const message = document.getElementById("map-message");

  officialReportLayer.clearLayers();

  try {
    const response = await axios.get(
      `/saved-locations/${savedLocationId}/nearby-official-reports`,
      {
        params: filters,
      },
    );

    const nearbyReports = response.data;

    for (const report of nearbyReports) {
      const reportCoords = [Number(report.latitude), Number(report.longitude)];

      const reportMarker = L.circleMarker(reportCoords, {
        radius: 4,
        color: "#b91c1c",
        fillColor: "#ef4444",
        weight: 1,
        fillOpacity: 0.55,
      }).addTo(officialReportLayer);

      const popup = createOfficialReportPopup(report);

      reportMarker.bindPopup(popup);
    }

    return nearbyReports;
  } catch (error) {
    console.error(error);

    if (error.response && error.response.data && error.response.data.error) {
      message.textContent = error.response.data.error;
    } else {
      message.textContent = "Nearby official reports could not be loaded";
    }

    message.hidden = false;

    return [];
  }
};

const loadNearbyReports = async (
  savedLocationId,
  userReportLayer,
  officialReportLayer,
  filters = {},
) => {
  const message = document.getElementById("map-message");

  message.hidden = true;
  message.textContent = "";

  const reportFilters = {
    category: filters.category,
    startDate: filters.startDate,
    endDate: filters.endDate,
  };

  let userReports = [];
  let officialReports = [];

  if (filters.source === "user") {
    officialReportLayer.clearLayers();

    userReports = await loadNearbyUserReports(
      savedLocationId,
      userReportLayer,
      reportFilters,
    );
  } else if (filters.source === "official") {
    userReportLayer.clearLayers();

    officialReports = await loadNearbyOfficialReports(
      savedLocationId,
      officialReportLayer,
      reportFilters,
    );
  } else {
    userReports = await loadNearbyUserReports(
      savedLocationId,
      userReportLayer,
      reportFilters,
    );

    officialReports = await loadNearbyOfficialReports(
      savedLocationId,
      officialReportLayer,
      reportFilters,
    );
  }

  if (userReports.length === 0 && officialReports.length === 0) {
    let hasFilters = false;

    if (filters.category) {
      hasFilters = true;
    } else if (filters.startDate) {
      hasFilters = true;
    } else if (filters.endDate) {
      hasFilters = true;
    }

    if (filters.source === "user") {
      if (hasFilters) {
        message.textContent =
          "No nearby user reports match the selected filters";
      } else {
        message.textContent = "No nearby user reports found within 1 mile";
      }
    } else if (filters.source === "official") {
      if (hasFilters) {
        message.textContent =
          "No nearby official reports match the selected filters";
      } else {
        message.textContent = "No nearby official reports found within 1 mile";
      }
    } else {
      if (hasFilters) {
        message.textContent = "No nearby complaints match the selected filters";
      } else {
        message.textContent = "No nearby complaints found within 1 mile";
      }
    }

    message.hidden = false;
  }
};

const setupReportFilters = (
  savedLocationId,
  userReportLayer,
  officialReportLayer,
) => {
  if (!filterForm) return;

  filterForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const source = filterForm.elements.source.value.trim();
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
      source,
      category,
      startDate,
      endDate,
    };

    await loadNearbyReports(
      savedLocationId,
      userReportLayer,
      officialReportLayer,
      filters,
    );
  });

  if (clearFiltersButton) {
    clearFiltersButton.addEventListener("click", async () => {
      filterForm.reset();
      await loadNearbyReports(
        savedLocationId,
        userReportLayer,
        officialReportLayer,
      );
    });
  }
};

const createMapLegend = (map) => {
  const legend = L.control({
    position: "bottomleft",
  });

  legend.onAdd = () => {
    const legendElement = L.DomUtil.create("div", "map-legend");

    const title = document.createElement("strong");
    title.textContent = "Map Legend";

    const officialItem = document.createElement("div");

    const officialMarker = document.createElement("span");
    officialMarker.classList.add("legend-marker", "legend-marker-official");

    const officialText = document.createElement("span");
    officialText.textContent = "Official NYPD Report";

    officialItem.append(officialMarker, officialText);

    const userItem = document.createElement("div");

    const userMarker = document.createElement("span");
    userMarker.classList.add("legend-marker", "legend-marker-user");

    const userText = document.createElement("span");
    userText.textContent = "User Generated Report";

    userItem.append(userMarker, userText);

    legendElement.append(title, officialItem, userItem);

    return legendElement;
  };

  legend.addTo(map);
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

  const officialReportLayer = L.layerGroup().addTo(map);

  createMapLegend(map);

  loadNearbyReports(savedLocationId, userReportLayer, officialReportLayer);

  setupReportFilters(savedLocationId, userReportLayer, officialReportLayer);
};

if (mapElement) {
  initializeSavedLocationMap(mapElement);
}
