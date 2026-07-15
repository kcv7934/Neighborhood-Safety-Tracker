import { ObjectId } from "mongodb";

const validBoroughs = [
  "MANHATTAN",
  "BROOKLYN",
  "QUEENS",
  "BRONX",
  "STATEN ISLAND",
];

export const validateString = (val, valName) => {
  if (val === undefined || val === null) throw `${valName} must be provided`;

  if (typeof val !== "string") throw `${valName} must of type 'string'`;

  value = value.trim();

  if (value.length === 0) throw `${valName} cannot be empty`;

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

export const validateBorough = (borough) => {
  borough = validateString(borough, "borough");

  const matchingBorough = validBoroughs.find(
    (validBorough) => validBorough.toLowerCase() === borough.toLowerCase(),
  );

  if (!matchingBorough)
    throw `Borough must be one of: ${validBoroughs.join(",")}`;

  return matchingBorough;
};
