import { ObjectId } from "mongodb";
import { userReports } from "../config/mongoCollections.js";
import * as validation from "./validation.js";
import { geocodeAddress } from "./geocoding.js";

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
