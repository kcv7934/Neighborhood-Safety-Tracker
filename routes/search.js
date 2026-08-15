import { Router } from "express";
import * as officialReportData from "../data/officialReports.js";
import * as userReportData from "../data/userReports.js";
import * as validation from "../data/validation.js";
import { handleApiError, handlePageError } from "./errorHandlers.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    return res.render("search", {
      title: "Search Complaints",
      boroughs: validation.validBoroughs,
      categories: validation.validCategories,
      officialOnlyCategories: validation.officialOnlyCategories,
      stylesheet: "search.css",
    });
  } catch (e) {
    return handlePageError(e, res, "Complaint Search");
  }
});

router.get("/results", async (req, res) => {
  try {
    let {
      source = "all",
      borough,
      precinct,
      category,
      startDate,
      endDate,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    source = validation.validateSource(source);
    sortOrder = validation.validateSortOrder(sortOrder);

    // precincts are only for official reports
    if (source === "user" && precinct !== undefined && precinct !== "") {
      throw "Precinct are only used to search for official reports";
    }

    if (sortBy === "precinct" && source !== "official") {
      throw "Sorting by precinct is only for official reports";
    }

    const officialReportFilters = {
      borough,
      precinct,
      category,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    };
    const userReportFilters = {
      borough,
      category,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    };

    let officialReportResults = [];
    let userReportResults = [];

    const hasPrecinct = precinct !== undefined && precinct !== "";

    if (source === "official" || source === "all") {
      officialReportResults = await officialReportData.searchOfficialReports(
        officialReportFilters,
      );
    }

    if (source === "user" || (source === "all" && !hasPrecinct)) {
      userReportResults =
        await userReportData.searchUserReports(userReportFilters);
    }

    const officialReportPrepared = officialReportResults.map((report) => {
      return {
        ...report,
        reportSource: "official",
      };
    });

    const userReportPrepared = userReportResults.map((report) => {
      return {
        ...report,
        reportSource: "user",
      };
    });

    const results = [...officialReportPrepared, ...userReportPrepared];

    const sortDirection = sortOrder === "asc" ? 1 : -1;

    results.sort((a, b) => {
      if (sortBy === "date") {
        const dateA =
          a.reportSource === "official"
            ? new Date(a.dateOccurred)
            : new Date(a.createdAt);
        const dateB =
          b.reportSource === "official"
            ? new Date(b.dateOccurred)
            : new Date(b.createdAt);

        return (dateA - dateB) * sortDirection;
      }

      const valueA = String(a[sortBy]);
      const valueB = String(b[sortBy]);

      return valueA.localeCompare(valueB) * sortDirection;
    });

    // only ever show 100 results
    const limitedResults = results.slice(0, 100);

    return res.status(200).json({
      count: limitedResults.length,
      results: limitedResults,
    });
  } catch (e) {
    return handleApiError(e, res);
  }
});

export default router;
