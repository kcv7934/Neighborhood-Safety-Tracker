import { ObjectId } from "mongodb";
import { savedLocations } from "../config/mongoCollections.js";
import * as validation from "./validation.js";
import { geocodeAddress } from "./geocoding.js";
import { NotFoundError, ForbiddenError } from "./error.js";

const cleanAddressForCompare = (address) => {
  const addressParts = address.split(",");

  const streetAndBoroughParts = addressParts.slice(0, 2);

  const cleanedParts = streetAndBoroughParts.map((addressPart) => {
    return addressPart.trim().toLowerCase();
  });

  const cleanedAddress = cleanedParts.join(",");

  return cleanedAddress;
};

export const createSavedLocation = async (
  userId,
  label,
  address,
  borough,
  tags = [],
) => {
  userId = validation.validateId(userId, "userId");

  label = validation.validateLocationLabel(label);

  address = validation.validateAddress(address);

  borough = validation.validateBorough(borough);

  tags = validation.validateTags(tags);

  const location = await geocodeAddress(address, borough);

  const newSavedLocation = {
    userId: new ObjectId(userId),
    label,
    address: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
    tags,
  };

  const savedLocationsCollection = await savedLocations();

  const userSavedLocations = await savedLocationsCollection
    .find({
      userId: new ObjectId(userId),
    })
    .toArray();

  const cleanedNewAddress = cleanAddressForCompare(location.address);
  const existingLocation = userSavedLocations.find((savedLocation) => {
    const cleanedSavedAddress = cleanAddressForCompare(savedLocation.address);
    return cleanedSavedAddress === cleanedNewAddress;
  });

  if (existingLocation) {
    throw "You have already saved this location";
  }

  const insertedInfo =
    await savedLocationsCollection.insertOne(newSavedLocation);

  if (!insertedInfo.acknowledged || !insertedInfo.insertedId) {
    throw "Could not add saved location";
  }

  return {
    ...newSavedLocation,
    _id: insertedInfo.insertedId.toString(),
    userId: newSavedLocation.userId.toString(),
  };
};

const prepareSavedLocation = (savedLocation) => {
  return {
    ...savedLocation,
    _id: savedLocation._id.toString(),
    userId: savedLocation.userId.toString(),
  };
};

export const getSavedLocationById = async (id) => {
  id = validation.validateId(id, "savedLocationId");

  const savedLocationsCollection = await savedLocations();

  const savedLocation = await savedLocationsCollection.findOne({
    _id: new ObjectId(id),
  });

  if (!savedLocation)
    throw new NotFoundError(`No saved location found with id '${id}'`);

  return prepareSavedLocation(savedLocation);
};

export const getSavedLocationsByUser = async (userId, tag) => {
  userId = validation.validateId(userId, "userId");

  const query = {
    userId: new ObjectId(userId),
  };

  if (tag !== undefined) {
    tag = validation.validateTag(tag);

    query.tags = {
      $regex: `^${tag}$`,
      $options: "i",
    };
  }

  const savedLocationsCollection = await savedLocations();

  const savedLocationList = await savedLocationsCollection
    .find(query)
    .sort({ label: 1 })
    .toArray();

  return savedLocationList.map(prepareSavedLocation);
};

export const getSavedLocationByIdForUser = async (id, currentUserId) => {
  currentUserId = validation.validateId(currentUserId, "currentUserId");

  const savedLocation = await getSavedLocationById(id);

  if (savedLocation.userId !== currentUserId)
    throw new ForbiddenError("You cannot access another user's saved location");

  return savedLocation;
};

export const updateSavedLocation = async (id, currentUserId, updates) => {
  id = validation.validateId(id, "savedLocationId");

  currentUserId = validation.validateId(currentUserId, "currentUserId");

  updates = validation.validateUpdateSavedLocation(updates);

  await getSavedLocationByIdForUser(id, currentUserId);

  const updateAddress = Object.hasOwn(updates, "address");
  const updateBorough = Object.hasOwn(updates, "borough");

  if (updateAddress !== updateBorough) {
    throw "Address and borough must be provided together";
  }

  const preparedUpdates = { ...updates };

  const savedLocationsCollection = await savedLocations();

  if (updateAddress && updateBorough) {
    const location = await geocodeAddress(updates.address, updates.borough);

    const otherSavedLocations = await savedLocationsCollection
      .find({
        _id: {
          $ne: new ObjectId(id),
        },
        userId: new ObjectId(currentUserId),
      })
      .toArray();

    const cleanedUpdatedAddress = cleanAddressForCompare(location.address);

    const existingLocation = otherSavedLocations.find((savedLocation) => {
      const cleanedSavedAddress = cleanAddressForCompare(savedLocation.address);

      return cleanedSavedAddress === cleanedUpdatedAddress;
    });

    if (existingLocation) throw "You already saved this location";

    preparedUpdates.address = location.address;
    preparedUpdates.latitude = location.latitude;
    preparedUpdates.longitude = location.longitude;
  }

  delete preparedUpdates.borough;

  const updatedSavedLocation = await savedLocationsCollection.findOneAndUpdate(
    {
      _id: new ObjectId(id),
      userId: new ObjectId(currentUserId),
    },
    {
      $set: preparedUpdates,
    },
    {
      returnDocument: "after",
    },
  );

  if (!updatedSavedLocation) {
    throw new NotFoundError(`No saved location found with id '${id}'`);
  }

  return prepareSavedLocation(updatedSavedLocation);
};

export const removeSavedLocation = async (id, currentUserId) => {
  id = validation.validateId(id, "savedLocationId");

  currentUserId = validation.validateId(currentUserId, "currentUserId");

  await getSavedLocationByIdForUser(id, currentUserId);

  const savedLocationsCollection = await savedLocations();

  const deletedLocation = await savedLocationsCollection.findOneAndDelete({
    _id: new ObjectId(id),
    userId: new ObjectId(currentUserId),
  });

  if (!deletedLocation)
    throw new NotFoundError(`No saved location found with id: '${id}'`);

  return {
    savedLocationId: id,
    deleted: true,
  };
};
