import { ObjectId } from "mongodb";

export const validateString = (val, valName) => {
  if (val === undefined || val === null) throw `${valName} must be provided`;

  if (typeof val !== "string") throw `${valName} must of type 'string'`;

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
};

/* userReports related validation */

const validBoroughs = [
  "MANHATTAN",
  "BROOKLYN",
  "QUEENS",
  "BRONX",
  "STATEN ISLAND",
];

const validCategories = [
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

export const validateBorough = (borough) => {
  borough = validateString(borough, "borough");

  const matchingBorough = validBoroughs.find(
    (validBorough) => validBorough.toLowerCase() === borough.toLowerCase(),
  );

  if (!matchingBorough)
    throw `Borough must be one of: ${validBoroughs.join(", ")}`;

  return matchingBorough;
};

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
