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

export const getNearbyUserReports = async (latitude, longitude) => {
  latitude = validation.validateLatitude(latitude);
  longitude = validation.validateLongitude(longitude);

  const reportCandidates = await getAllUserReports();

  const reportsWithDistance = reportCandidates.map((report) => {
    const distanceInMiles = findDistanceBetweenInMiles(
      latitude,
      longitude,
      report.latitude,
      report.longitude,
    );

    return {
      ...report,
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
