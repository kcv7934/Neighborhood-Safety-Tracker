import { ObjectId } from "mongodb";
import { userReports } from "../config/mongoCollections.js";
import * as validation from "./validation.js";
import { geocodeAddress } from "./geocoding.js";
import { NotFoundError, ForbiddenError } from "./error.js";
import { findDistanceBetweenInMiles } from "./locationUtils.js";

export const createUserReport = async (
  authorId,
  category,
  address,
  borough,
  description,
) => {
  authorId = validation.validateId(authorId, "authorId");
  category = validation.validateCategory(category);
  address = validation.validateAddress(address);
  borough = validation.validateBorough(borough);
  description = validation.validateDescription(description);

  const location = await geocodeAddress(address, borough);

  const userReportsCollection = await userReports();
  const currentDate = new Date();

  const newUserReport = {
    authorId: new ObjectId(authorId),
    category,
    address: location.address,
    borough,
    latitude: location.latitude,
    longitude: location.longitude,
    description,
    status: "visible",
    createdAt: currentDate,
    updatedAt: currentDate,
  };

  const insertedInfo = await userReportsCollection.insertOne(newUserReport);

  if (!insertedInfo.acknowledged || !insertedInfo.insertedId)
    throw "Could not add userReport";

  return {
    ...newUserReport,
    _id: insertedInfo.insertedId.toString(),
    authorId: newUserReport.authorId.toString(),
  };
};

export const getAllUserReports = async (includeHidden = false) => {
  const userReportsCollection = await userReports();

  const query = includeHidden ? {} : { status: "visible" };

  let userReportList = await userReportsCollection
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  userReportList = userReportList.map((userReport) => {
    userReport._id = userReport._id.toString();
    userReport.authorId = userReport.authorId.toString();
    return userReport;
  });

  return userReportList;
};

export const getUserReportById = async (id, includeHidden = false) => {
  id = validation.validateId(id);

  const userReportsCollection = await userReports();

  const query = {
    _id: new ObjectId(id),
  };

  if (!includeHidden) {
    query.status = "visible";
  }

  const userReport = await userReportsCollection.findOne(query);

  if (!userReport)
    throw new NotFoundError(`No user report found with id '${id}'`);
  userReport._id = userReport._id.toString();
  userReport.authorId = userReport.authorId.toString();
  return userReport;
};

export const getUserReportByIdForAuthor = async (id, currentUserId) => {
  currentUserId = validation.validateId(currentUserId, "currentUserId");
  const userReport = await getUserReportById(id);
  if (userReport.authorId !== currentUserId) {
    throw new ForbiddenError("You cannot access another user's report");
  }
  return userReport;
};

export const removeUserReport = async (id, currentUserId) => {
  id = validation.validateId(id);

  currentUserId = validation.validateId(currentUserId, "currentUserId");

  await getUserReportByIdForAuthor(id, currentUserId);

  const userReportsCollection = await userReports();

  const deletedInfo = await userReportsCollection.findOneAndDelete({
    _id: new ObjectId(id),
    authorId: new ObjectId(currentUserId),
  });

  if (!deletedInfo)
    throw new NotFoundError(`No user report found with id '${id}'`);
  return {
    userReportId: id,
    deleted: true,
  };
};

export const updateUserReport = async (id, currentUserId, updates) => {
  id = validation.validateId(id);

  currentUserId = validation.validateId(currentUserId, "currentUserId");

  updates = validation.validateUpdateUserReport(updates);

  const userReport = await getUserReportByIdForAuthor(id, currentUserId);

  const currentStreetAddress = userReport.address.split(",")[0].trim();

  const addressChanged =
    Object.hasOwn(updates, "address") &&
    updates.address.toLowerCase() !== currentStreetAddress.toLowerCase();

  const boroughChanged =
    Object.hasOwn(updates, "borough") && updates.borough !== userReport.borough;

  if (addressChanged || boroughChanged) {
    const address = addressChanged ? updates.address : currentStreetAddress;

    const borough = boroughChanged ? updates.borough : userReport.borough;

    const location = await geocodeAddress(address, borough);

    updates.address = location.address;
    updates.borough = borough;
    updates.latitude = location.latitude;
    updates.longitude = location.longitude;
  } else {
    delete updates.address;
    delete updates.borough;
  }

  updates.updatedAt = new Date();

  const userReportsCollection = await userReports();

  const updatedUserReport = await userReportsCollection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: "after" },
  );

  if (!updatedUserReport)
    throw new NotFoundError(`No user report found with id '${id}'`);

  updatedUserReport._id = updatedUserReport._id.toString();
  updatedUserReport.authorId = updatedUserReport.authorId.toString();

  return updatedUserReport;
};

export const getUserReportsByAuthor = async (authorId) => {
  authorId = validation.validateId(authorId, "authorId");

  const userReportsCollection = await userReports();

  let reports = await userReportsCollection
    .find({ authorId: new ObjectId(authorId), status: "visible" })
    .sort({ createdAt: -1 })
    .toArray();

  reports = reports.map((report) => {
    report._id = report._id.toString();
    report.authorId = report.authorId.toString();
    return report;
  });
  return reports;
};

export const getNearbyUserReports = async (
  latitude,
  longitude,
  category,
  startDate,
  endDate,
) => {
  latitude = validation.validateLatitude(latitude);
  longitude = validation.validateLongitude(longitude);

  let validatedCategory = null;
  let validatedStartDateValue = null;
  let validatedEndDateValue = null;

  if (category !== undefined && category !== "") {
    validatedCategory = validation.validateCategory(category);
  }

  if (startDate !== undefined && startDate !== "") {
    validatedStartDateValue = validation.validateDate(startDate, "startDate");
  }

  if (endDate !== undefined && endDate !== "") {
    validatedEndDateValue = validation.validateDate(endDate, "endDate");

    // set end date to end of that day
    validatedEndDateValue.setUTCHours(23, 59, 59, 999);
  }

  if (
    validatedStartDateValue !== null &&
    validatedEndDateValue !== null &&
    validatedStartDateValue > validatedEndDateValue
  ) {
    throw "Start date cannot be after end date";
  }

  const query = {
    status: "visible",
  };

  if (validatedCategory !== null) query.category = validatedCategory;

  if (validatedStartDateValue !== null || validatedEndDateValue !== null) {
    query.createdAt = {};

    if (validatedStartDateValue !== null) {
      query.createdAt.$gte = validatedStartDateValue;
    }
    if (validatedEndDateValue !== null) {
      query.createdAt.$lte = validatedEndDateValue;
    }
  }

  const userReportsCollection = await userReports();

  const reportCandidates = await userReportsCollection.find(query).toArray();

  const reportsWithDistance = reportCandidates.map((report) => {
    const distanceInMiles = findDistanceBetweenInMiles(
      latitude,
      longitude,
      report.latitude,
      report.longitude,
    );

    return {
      ...report,
      _id: report._id.toString(),
      authorId: report.authorId.toString(),
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

export const searchUserReports = async ({
  borough,
  category,
  startDate,
  endDate,
  sortBy = "date",
  sortOrder = "desc",
} = {}) => {
  const query = { status: "visible" };

  if (borough !== undefined && borough !== "") {
    borough = validation.validateBorough(borough);
    query.borough = borough;
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
    validatedEndDate.setUTCHours(23, 59, 59, 999);
  }

  if (
    validatedStartDate &&
    validatedEndDate &&
    validatedStartDate > validatedEndDate
  ) {
    throw "Start date cannot be after end date";
  }

  if (validatedStartDate || validatedEndDate) {
    query.createdAt = {};

    if (validatedStartDate) {
      query.createdAt.$gte = validatedStartDate;
    }

    if (validatedEndDate) {
      query.createdAt.$lte = validatedEndDate;
    }
  }

  const validSortFields = ["date", "borough", "category"];

  sortBy = validation.validateString(sortBy, "sortBy");

  if (!validSortFields.includes(sortBy)) {
    throw `sortBy must be one of ${validSortFields.join(", ")}`;
  }

  const sortField = sortBy === "date" ? "createdAt" : sortBy;

  sortOrder = validation.validateSortOrder(sortOrder);

  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const userReportsCollection = await userReports();

  let reports = await userReportsCollection
    .find(query)
    .sort({ [sortField]: sortDirection })
    .limit(100)
    .toArray();

  reports = reports.map((report) => ({
    ...report,
    _id: report._id.toString(),
    authorId: report.authorId.toString(),
  }));

  return reports;
};

export const hideUserReport = async (reportId) => {
  reportId = validation.validateId(reportId, "reportId");

  const userReportsCollection = await userReports();

  const updatedUserReport = await userReportsCollection.findOneAndUpdate(
    {
      _id: new ObjectId(reportId),
    },
    {
      $set: {
        status: "hidden",
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!updatedUserReport)
    throw new NotFoundError(`No user report found with id '${reportId}'`);

  updatedUserReport._id = updatedUserReport._id.toString();
  updatedUserReport.authorId = updatedUserReport.authorId.toString();

  return updatedUserReport;
};