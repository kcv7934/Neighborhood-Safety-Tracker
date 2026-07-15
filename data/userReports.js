import { ObjectId, ReturnDocument } from "mongodb";
import { userReports } from "../config/mongoCollections.js";
import * as validation from "./validation.js";
import { geocodeAddress } from "./geocoding.js";
import { NotFoundError } from "./error.js";

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
  description = validation.validateString(description, "description");

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

export const getAllUserReports = async () => {
  const userReportsCollection = await userReports();

  let userReportList = await userReportsCollection
    .find({ status: "visible" })
    .sort({ createdAt: -1 })
    .toArray();

  userReportList = userReportList.map((userReport) => {
    userReport._id = userReport._id.toString();
    userReport.authorId = userReport.authorId.toString();
    return userReport;
  });

  return userReportList;
};

export const getUserReportById = async (id) => {
  id = validation.validateId(id);

  const userReportsCollection = await userReports();

  const userReport = await userReportsCollection.findOne({
    _id: new ObjectId(id),
  });

  if (!userReport)
    throw new NotFoundError(`No user report found with id '${id}'`);
  userReport._id = userReport._id.toString();
  userReport.authorId = userReport.authorId.toString();
  return userReport;
};

export const removeUserReport = async (id) => {
  id = validation.validateId(id);

  const userReportsCollection = await userReports();

  const deletedInfo = await userReportsCollection.findOneAndDelete({
    _id: new ObjectId(id),
  });

  if (!deletedInfo)
    throw new NotFoundError(`No user report found with id '${id}'`);
  return {
    userReportId: id,
    deleted: true,
  };
};

export const updateUserReport = async (id, updates) => {
  id = validation.validateId(id);
  updates = validation.validateUpdateUserReport(updates);

  const userReport = await getUserReportById(id);

  const updateAddress = Object.hasOwn(updates, "address");
  const updateBorough = Object.hasOwn(updates, "borough");

  if (updateAddress || updateBorough) {
    const address = updateAddress ? updateAddress : userReport.address;
    const borough = updateBorough ? updateBorough : userReport.borough;

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
