const searchForm = document.getElementById("complaint-search-form");

const sourceInput = document.getElementById("source");
const boroughInput = document.getElementById("borough");
const precinctInput = document.getElementById("precinct");
const categoryInput = document.getElementById("category");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const sortByInput = document.getElementById("sortBy");
const sortOrderInput = document.getElementById("sortOrder");

const errorMessage = document.getElementById("search-errors");
const results = document.getElementById("search-results");
const resultCount = document.getElementById("result-count");

const clearFiltersButton = document.getElementById("clear-filters");

const officialOnlyCategories = document.querySelectorAll(
  ".official-only-category",
);

const precinctSortOption = document.getElementById("precinct-sort-option");

const handleSourceChange = () => {
  const source = sourceInput.value;

  if (source === "user") {
    precinctInput.value = "";
    precinctInput.disabled = true;
  } else {
    precinctInput.disabled = false;
  }

  if (source === "official") {
    officialOnlyCategories.forEach((option) => {
      option.hidden = false;
    });

    precinctSortOption.hidden = false;
  } else {
    officialOnlyCategories.forEach((option) => {
      option.hidden = true;

      if (categoryInput.value === option.value) {
        categoryInput.value = "";
      }
    });

    precinctSortOption.hidden = true;

    if (sortByInput.value === "precinct") {
      sortByInput.value = "date";
    }
  }
};

const validateSearchForm = () => {
  const source = sourceInput.value;
  const precinct = precinctInput.value;
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  const sortBy = sortByInput.value;
  const sortOrder = sortOrderInput.value;

  const validSources = ["all", "official", "user"];

  if (!validSources.includes(source))
    throw "Source must be all, official, or user";

  if (precinct !== "") {
    if (!/^\d{1,3}$/.test(precinct)) {
      throw "Precinct must be a number between 1 and 3 digits";
    }

    if (source === "user") {
      throw "Precincts are only used to search official reports";
    }
  }

  if (startDate !== "" && endDate !== "" && startDate > endDate)
    throw "Start date cannot be after end date";

  const validSortFields = ["date", "borough", "category", "precinct"];

  if (!validSortFields.includes(sortBy))
    throw "Sort option must be either date, borough, category, or precinct";

  if (sortBy === "precinct" && source !== "official")
    throw "Sorting by precinct is only for official reports";

  if (sortOrder !== "asc" && sortOrder !== "desc")
    throw "Sort order must either be asc or desc";

  return true;
};

const searchComplaints = async () => {
  const response = await axios.get("/search/results", {
    params: {
      source: sourceInput.value,
      borough: boroughInput.value,
      precinct: precinctInput.value,
      category: categoryInput.value,
      startDate: startDateInput.value,
      endDate: endDateInput.value,
      sortBy: sortByInput.value,
      sortOrder: sortOrderInput.value,
    },
  });

  return response.data;
};

const displayResults = (reports) => {
  results.textContent = "";

  if (reports.length === 0) {
    const noResults = document.createElement("p");
    noResults.textContent = "No complaints were found";
    results.appendChild(noResults);
    return;
  }

  reports.forEach((report) => {
    const reportElement = document.createElement("div");
    reportElement.classList.add("search-result");

    const source = document.createElement("h2");

    if (report.reportSource === "official") {
      source.textContent = "Official Report";
    } else {
      source.textContent = "User Report";
    }

    reportElement.appendChild(source);

    const category = document.createElement("p");
    category.textContent = `Category: ${report.category}`;
    reportElement.appendChild(category);

    const borough = document.createElement("p");
    borough.textContent = `Borough: ${report.borough}`;
    reportElement.appendChild(borough);

    if (report.reportSource === "official") {
      const crimeType = document.createElement("p");
      crimeType.textContent = `Crime Type: ${report.crimeType}`;
      reportElement.appendChild(crimeType);

      const precinct = document.createElement("p");
      precinct.textContent = `Precinct: ${report.precinct}`;
      reportElement.appendChild(precinct);

      const date = document.createElement("p");
      date.textContent = `Date: ${new Date(report.dateOccurred).toLocaleDateString()}`;
      reportElement.appendChild(date);

      const viewDetails = document.createElement("a");
      viewDetails.textContent = "View Details";
      viewDetails.href = `/official-reports/${report._id}`;
      viewDetails.classList.add("view-report-details");
      reportElement.appendChild(viewDetails);

      const saveLocation = document.createElement("a");
      saveLocation.textContent = "Save Location";
      saveLocation.href = `/saved-locations/create?officialReportId=${report._id}`;
      saveLocation.classList.add("save-report-location");
      reportElement.appendChild(saveLocation);
    } else {
      const address = document.createElement("p");
      address.textContent = `Address: ${report.address}`;
      reportElement.appendChild(address);

      const description = document.createElement("p");
      description.textContent = `Description: ${report.description}`;

      reportElement.appendChild(description);

      const date = document.createElement("p");
      date.textContent = `Date Submitted: ${new Date(report.createdAt).toLocaleDateString()}`;

      reportElement.appendChild(date);

      const viewDetails = document.createElement("a");
      viewDetails.textContent = "View Details";
      viewDetails.href = `/user-reports/${report._id}`;
      viewDetails.classList.add("view-report-details");
      reportElement.appendChild(viewDetails);

      const saveLocation = document.createElement("a");
      saveLocation.textContent = "Save Location";
      saveLocation.href = `/saved-locations/create?userReportId=${report._id}`;
      saveLocation.classList.add("save-report-location");

      reportElement.appendChild(saveLocation);
    }

    results.appendChild(reportElement);
  });
};

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  errorMessage.textContent = "";
  results.textContent = "";
  resultCount.textContent = "";

  try {
    validateSearchForm();

    const data = await searchComplaints();

    resultCount.textContent = `${data.count} complaints found`;

    displayResults(data.results);
  } catch (e) {
    if (e.response && e.response.data && e.response.data.error) {
      errorMessage.textContent = e.response.data.error;
    } else if (typeof e === "string") {
      errorMessage.textContent = e;
    } else {
      errorMessage.textContent = "Could not search complaints";
    }
  }
});

clearFiltersButton.addEventListener("click", () => {
  sourceInput.value = "all";
  boroughInput.value = "";
  precinctInput.value = "";
  categoryInput.value = "";
  startDateInput.value = "";
  endDateInput.value = "";
  sortByInput.value = "date";
  sortOrderInput.value = "desc";

  errorMessage.textContent = "";
  results.textContent = "";
  resultCount.textContent = "";

  handleSourceChange();
});

sourceInput.addEventListener("change", handleSourceChange);
