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

export const validateArray = (arr, arrName, minLength = 0, maxLength = 100) => {
  if (arr === undefined || arr === null) {
    throw `${arrName} must be provided`;
  }

  if (!Array.isArray(arr)) {
    throw `${arrName} must be of type 'array'`;
  }

  if (arr.length < minLength) {
    throw `${arrName} must contain at least ${minLength} items`;
  }

  if (arr.length > maxLength) {
    throw `${arrName} must contain at most ${maxLength} items`;
  }

  return arr;
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

const validUserReportUpdates = [
  "category",
  "address",
  "borough",
  "description",
];

export const validateUpdateUserReport = (obj) => {
  obj = validateObject(obj, "userReport");
  obj = validateObjectKeys(obj, validUserReportUpdates);

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

/* savedLocations related validation */

export const validateLocationLabel = (label) => {
  label = validateString(label, "label");

  if (label.length > 50) {
    throw "Label cannot be more than 50 characters";
  }

  return label;
};

export const validateTags = (tags) => {
  tags = validateArray(tags, "tags", 0, 10);

  const validatedTags = [];

  const tagCandidates = new Set();

  for (let i = 0; i < tags.length; i++) {
    const tag = validateTag(tags[i], `tag at index ${i}`);

    const cleanedTag = tag.toLowerCase();

    if (tagCandidates.has(cleanedTag)) {
      throw "Tags must be unique";
    }

    tagCandidates.add(cleanedTag);
    validatedTags.push(tag);
  }

  return validatedTags;
};

const validSavedLocationUpdates = ["label", "address", "borough", "tags"];

export const validateUpdateSavedLocation = (obj) => {
  obj = validateObject(obj, "savedLocation");

  obj = validateObjectKeys(obj, validSavedLocationUpdates);

  const validatedUpdates = {};

  for (const key of Object.keys(obj)) {
    switch (key) {
      case "label":
        validatedUpdates.label = validateLocationLabel(obj.label);
        break;
      case "address":
        validatedUpdates.address = validateAddress(obj.address);
        break;
      case "borough":
        validatedUpdates.borough = validateBorough(obj.borough);
        break;
      case "tags":
        validatedUpdates.tags = validateTags(obj.tags);
        break;
    }
  }

  return validatedUpdates;
};

export const validateTag = (tag, tagName = "tag") => {
  tag = validateString(tag, tagName);

  if (tag.length > 25) throw "A tag cannot be more than 25 characters";

  if (!/^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/.test(tag)) {
    throw "Tags may only contain letters, numbers, and single spaces";
  }

  return tag;
};
