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
  // validate location id, current user id, and updates fields
  id = validation.validateId(id, "savedLocationId");

  currentUserId = validation.validateId(currentUserId, "currentUserId");

  updates = validation.validateUpdateSavedLocation(updates);

  // make sure the location exists and belongs to current user
  const savedLocation = await getSavedLocationByIdForUser(id, currentUserId);

  const hasAddress = Object.hasOwn(updates, "address");
  const hasBorough = Object.hasOwn(updates, "borough");

  // address and borough are required to geocode a location so make sure they are supplied
  if (hasAddress !== hasBorough) {
    throw "Address and borough must be provided together";
  }

  // Extract the current street and borough from the formatted complete address stored in DB
  // Ex: "11 Wall Street, MANHATTEN, 11111" => "11 Wall Street" and "MANHATTEN"
  const currentAddressParts = savedLocation.address.split(",");

  const currentStreetAddress = currentAddressParts[0].trim();

  const currentBorough = currentAddressParts[1].trim();

  // Check to see if supplied address or borough actually changed from original
  const addressChanged =
    hasAddress &&
    updates.address.toLowerCase() !== currentStreetAddress.toLowerCase();
  const boroughChanged = hasBorough && updates.borough !== currentBorough;

  const preparedUpdates = { ...updates };

  const savedLocationsCollection = await savedLocations();

  // only geocode address if either the street or borough changed
  if (addressChanged || boroughChanged) {
    const address = addressChanged ? updates.address : currentStreetAddress;
    const borough = boroughChanged ? updates.borough : currentBorough;

    const location = await geocodeAddress(address, borough);

    // get the user's other saved locations if exist while excluding current location
    // being updated
    const otherSavedLocations = await savedLocationsCollection
      .find({
        _id: {
          $ne: new ObjectId(id),
        },
        userId: new ObjectId(currentUserId),
      })
      .toArray();

    const cleanedUpdatedAddress = cleanAddressForCompare(location.address);

    // Check whether the user has another location that has the same street and borough
    // to prevent updating a new saved location to the same address
    const existingLocation = otherSavedLocations.find((otherSavedLocation) => {
      const cleanedSavedAddress = cleanAddressForCompare(
        otherSavedLocation.address,
      );

      return cleanedSavedAddress === cleanedUpdatedAddress;
    });

    if (existingLocation) throw "You already saved this location";

    // Store the complete address and coordinates returned by geocoding for new address supplied
    preparedUpdates.address = location.address;
    preparedUpdates.latitude = location.latitude;
    preparedUpdates.longitude = location.longitude;
  } else {
    // address is unchanged so remove it from query for $set
    delete preparedUpdates.address;
  }

  // remove the borough since its only used for geocoding and not stored in DB
  delete preparedUpdates.borough;

  // if all submitted values where removed, then you have the same original savedLocation
  // so just return the original
  if (Object.keys(preparedUpdates).length === 0) {
    return savedLocation;
  }

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
