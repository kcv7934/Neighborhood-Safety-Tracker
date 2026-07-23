import { ObjectId } from "mongodb";

export const validateString = (val, valName) => {
  if (val === undefined || val === null) throw `${valName} must be provided`;

  if (typeof val !== "string") throw `${valName} must be of type 'string'`;

  val = val.trim();

  if (val.length === 0) throw `${valName} cannot be empty`;

  return val;
};

export const validateNumber = (val, valName, min, max) => {
  if (val === undefined || val === null) throw `${valName} must be provided`;

  if (typeof val !== "number" || !Number.isFinite(val))
    throw `${valName} must be a valid number`;

  if (val < min || val > max)
    throw `${valName} must be between ${min} and ${max}`;

  return val;
};

export const validateId = (id, idName = "id") => {
  id = validateString(id, idName);

  if (!ObjectId.isValid(id)) throw `${idName} must be valid ObjectId`;

  return id;
};

export const validateObject = (obj, objName) => {
  if (obj === undefined) throw `${objName} must be provided`;

  if (typeof obj !== "object" || Array.isArray(obj) || obj === null)
    throw `${objName} is not of type 'Object'`;

  if (Object.keys(obj).length === 0) throw `${objName} is empty`;

  return obj;
};

export const validateObjectKeys = (obj, validKeys) => {
  const objKeys = Object.keys(obj);
  for (const key of objKeys) {
    if (!validKeys.includes(key))
      throw `Object contains unsupported field '${key}'`;
  }
  return obj;
};

/* userReports related validation */

export const validBoroughs = [
  "MANHATTAN",
  "BROOKLYN",
  "QUEENS",
  "BRONX",
  "STATEN ISLAND",
];

export const validateBorough = (borough) => {
  borough = validateString(borough, "borough");

  const matchingBorough = validBoroughs.find(
    (validBorough) => validBorough.toLowerCase() === borough.toLowerCase(),
  );

  if (!matchingBorough)
    throw `Borough must be one of: ${validBoroughs.join(", ")}`;

  return matchingBorough;
};

export const validCategories = [
  "THEFT",
  "MOTOR VEHICLE THEFT",
  "ROBBERY",
  "BURGLARY",
  "ASSAULT",
  "HARASSMENT",
  "VANDALISM",
  "DRUG OFFENSE",
  "WEAPONS OFFENSE",
  "FRAUD",
  "SEXUAL OFFENSE",
  "TRESPASSING",
  "TRAFFIC OFFENSE",
  "IMPAIRED DRIVING",
  "ARSON",
  "KIDNAPPING",
  "HOMICIDE",
  "PUBLIC ORDER OFFENSE",
  "OTHER",
];

export const validateCategory = (category) => {
  category = validateString(category, "category");

  const matchingCategory = validCategories.find(
    (validCategory) => validCategory.toLowerCase() === category.toLowerCase(),
  );

  if (!matchingCategory)
    throw `Category must be one of: ${validCategories.join(", ")}`;

  return matchingCategory;
};

export const validateAddress = (address) => {
  address = validateString(address, "address");

  if (address.length > 50) throw "Address cannot be more than 50 characters";

  return address;
};

export const validateDescription = (description) => {
  description = validateString(description, "description");

  if (description.length < 10)
    throw "Description must be at least 10 characters";

  if (description.length > 500)
    throw "Description cannot be more than 500 characters";

  return description;
};

const validUpdates = ["category", "address", "borough", "description"];

export const validateUpdateUserReport = (obj) => {
  obj = validateObject(obj, "userReport");
  obj = validateObjectKeys(obj, validUpdates);

  const validatedUpdates = {};

  for (const key of Object.keys(obj)) {
    switch (key) {
      case "category":
        validatedUpdates.category = validateCategory(obj.category);
        break;

      case "address":
        validatedUpdates.address = validateAddress(obj.address);
        break;

      case "borough":
        validatedUpdates.borough = validateBorough(obj.borough);
        break;

      case "description":
        validatedUpdates.description = validateDescription(obj.description);
        break;
    }
  }

  return validatedUpdates;
};
