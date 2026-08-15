import { ObjectId } from "mongodb";
import { officialReports } from "../config/mongoCollections.js";
import * as validation from "./validation.js";
import { geocodeAddress } from "./geocoding.js";
import { NotFoundError, ForbiddenError } from "./error.js";
import { findDistanceBetweenInMiles } from "./locationUtils.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const getOfficialReportById = async (reportId) => {
  reportId = validation.validateId(reportId, "reportId");

  const officialReportsCollection = await officialReports();
  const officialReport = await officialReportsCollection.findOne({
    _id: new ObjectId(reportId),
  });

  if (!officialReport) {
    throw new NotFoundError(`Official report with id ${reportId} not found`);
  }

  return {
    ...officialReport,
    _id: officialReport._id.toString(),
  };
};

export const getAllOfficialReports = async () => {
  const officialReportsCollection = await officialReports();

  let officialReportList = await officialReportsCollection.find().toArray();

  officialReportList = officialReportList.map((report) => ({
    ...report,
    _id: report._id.toString(),
  }));

  return officialReportList;
};

export const queryOfficialReportsFromDB = async () => {
  let baseUrl =
    "https://data.cityofnewyork.us/api/v3/views/5uac-w243/query.json";

  const appToken = process.env.APP_TOKEN;
  if (!appToken) {
    throw new Error("APP_TOKEN is not defined in the environment variables");
  }

  baseUrl += `?app_token=${appToken}`;

  //const currentDate = new Date();
  //const currentYear = currentDate.getFullYear();

  // Gets 3 months ago from the current date
  //const monthsBefore = 3;
  //const currentMonth = String(currentDate.getMonth() + 1 - 3).padStart(2, "0");

  //const currentDay = String(currentDate.getDate()).padStart(2, "0");
  //const formattedDate = `${currentYear}-${currentMonth}-${currentDay}`;

  //baseUrl += `&query=SELECT%20*%20WHERE%20%60cmplnt_fr_dt%60%20%3E%3D%20'${formattedDate}'`;

  // Gets from start of current year to present
  const currentYear = new Date().getFullYear();
  const formattedDate = `${currentYear}-01-01`;

  baseUrl += `&query=SELECT%20*%20WHERE%20%60cmplnt_fr_dt%60%20%3E%3D%20'${formattedDate}'`;

  try {
    const response = await axios.get(baseUrl);
    console.log(
      `Successfully queried ${response.data.length} official reports from the database`,
    );
    return response.data;
  } catch (error) {
    console.error("Error querying official reports:", error);
    throw new Error("Failed to query official reports from the database");
  }
};

export const searchOfficialReports = async ({
  borough,
  precinct,
  category,
  startDate,
  endDate,
  sortBy = "date",
  sortOrder = "desc",
} = {}) => {
  const query = {};

  if (borough !== undefined && borough !== "") {
    borough = validation.validateBorough(borough);
    query.borough = borough;
  }

  if (precinct !== undefined && precinct !== "") {
    precinct = validation.validatePrecinct(precinct);
    query.precinct = precinct;
  }

  if (category !== undefined && category !== "") {
    category = validation.validateSearchCategory(category);
    query.category = category;
  }

  let validatedStartDate;
  let validatedEndDate;

  if (startDate !== undefined && startDate !== "") {
    validatedStartDate = validation.validateDate(startDate, "startDate");
  }

  if (endDate !== undefined && endDate !== "") {
    validatedEndDate = validation.validateDate(endDate, "endDate");
  }

  if (
    validatedStartDate &&
    validatedEndDate &&
    validatedStartDate > validatedEndDate
  ) {
    throw "Start date cannot be after end date";
  }

  // official crime dates are stored as ISO strings so
  if (validatedStartDate || validatedEndDate) {
    query.dateOccurred = {};
    if (validatedStartDate) {
      query.dateOccurred.$gte = `${startDate}T00:00:00.000`;
    }
    if (validatedEndDate) {
      query.dateOccurred.$lte = `${endDate}T23:59:59.999`;
    }
  }

  sortBy = validation.validateOfficialReportSortBy(sortBy);

  sortOrder = validation.validateSortOrder(sortOrder);

  const sortField = sortBy === "date" ? "dateOccurred" : sortBy;

  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const officialReportsCollection = await officialReports();

  let reports = await officialReportsCollection
    .find(query)
    .sort({ [sortField]: sortDirection })
    .limit(100)
    .toArray();

  reports = reports.map((report) => ({
    ...report,
    _id: report._id.toString(),
  }));

  return reports;
};

export const getNearbyOfficialReports = async (
  latitude,
  longitude,
  category,
  startDate,
  endDate,
) => {
  latitude = validation.validateLatitude(latitude);
  longitude = validation.validateLongitude(longitude);

  let validatedCategory;
  let validatedStartDateValue;
  let validatedEndDateValue;

  if (category !== undefined && category !== "") {
    validatedCategory = validation.validateSearchCategory(category);
  }

  if (startDate !== undefined && startDate !== "") {
    validatedStartDateValue = validation.validateDate(startDate, "startDate");
  }

  if (endDate !== undefined && endDate !== "") {
    validatedEndDateValue = validation.validateDate(endDate, "endDate");
  }

  if (
    validatedStartDateValue !== undefined &&
    validatedEndDateValue !== undefined &&
    validatedStartDateValue > validatedEndDateValue
  ) {
    throw "Start date cannot be after end date";
  }

  const query = {};

  if (validatedCategory !== undefined) {
    query.category = validatedCategory;
  }

  if (
    validatedStartDateValue !== undefined &&
    validatedEndDateValue !== undefined
  ) {
    query.dateOccurred = {
      $gte: `${startDate}T00:00:00.000`,
      $lte: `${endDate}T23:59:59.999`,
    };
  } else if (validatedStartDateValue !== undefined) {
    query.dateOccurred = {
      $gte: `${startDate}T00:00:00.000`,
    };
  } else if (validatedEndDateValue !== undefined) {
    query.dateOccurred = {
      $lte: `${endDate}T23:59:59.999`,
    };
  }

  const officialReportsCollection = await officialReports();

  const reportCandidates = await officialReportsCollection
    .find(query)
    .toArray();

  const reportsWithDistance = reportCandidates.map((report) => {
    const reportLatitude = Number(report.latitude);
    const reportLongitude = Number(report.longitude);

    const distanceInMiles = findDistanceBetweenInMiles(
      latitude,
      longitude,
      reportLatitude,
      reportLongitude,
    );

    return {
      ...report,
      _id: report._id.toString(),
      distanceInMiles,
    };
  });

  const nearbyReports = reportsWithDistance.filter((report) => {
    return report.distanceInMiles <= 1;
  });

  nearbyReports.sort((a, b) => {
    return a.distanceInMiles - b.distanceInMiles;
  });

  return nearbyReports;
};
