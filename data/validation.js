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

export const validateLatitude = (latitude) => {
  return validateNumber(latitude, "latitude", -90, 90);
};

export const validateLongitude = (longitude) => {
  return validateNumber(longitude, "longitude", -180, 180);
};

export const validateDate = (dateStr, dateName = "date") => {
  dateStr = validateString(dateStr, dateName);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw `${dateName} must use the format YYYY-MM-DD`;
  }

  const date = new Date(`${dateStr}T00:00:00.000Z`);

  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) {
    throw `${dateName} must be a valid date`;
  }

  const preparedDateStr = date.toISOString().slice(0, 10);

  if (preparedDateStr !== dateStr) {
    throw `${dateName} must be a valid date`;
  }

  return date;
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

export const officialOnlyCategories = [
  "CHILD-RELATED OFFENSE",
  "PUBLIC ADMINISTRATION OFFENSE",
];

export const validSearchCategories = [
  ...validCategories,
  ...officialOnlyCategories,
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

/* official crime reports validation */

export const validatePrecinct = (precinct) => {
  precinct = validateString(precinct, "precinct");

  if (!/^\d{1,3}$/.test(precinct)) {
    throw "Precinct must be a number between 1 and 3 digits";
  }

  return String(Number(precinct));
};

export const validateSortOrder = (sortOrder) => {
  sortOrder = validateString(sortOrder, "sortOrder").toLowerCase();

  if (sortOrder !== "asc" && sortOrder !== "desc") {
    throw "sortOrder must be either asc or desc";
  }

  return sortOrder;
};

export const validateOfficialReportSortBy = (sortBy) => {
  sortBy = validateString(sortBy, "sortBy");

  const validSortFields = ["date", "borough", "precinct", "category"];

  if (!validSortFields.includes(sortBy))
    throw `sortBy must be one of: ${validSortFields.join(", ")}`;

  return sortBy;
};

export const validateSearchCategory = (category) => {
  category = validateString(category, "category");

  const matchingCategory = validSearchCategories.find(
    (validCategory) => validCategory.toLowerCase() === category.toLowerCase(),
  );

  if (!matchingCategory)
    throw `Category must be one of: ${validSearchCategories.join(", ")}`;

  return matchingCategory;
};

export const mapOfficialCrimeCategory = (crimeType) => {
  if (crimeType === undefined || crimeType === null || crimeType === "(null)") {
    return "OTHER";
  }

  crimeType = validateString(crimeType, "crimeType");

  const categoryMap = {
    "ADMINISTRATIVE CODE": "OTHER",
    "ALCOHOLIC BEVERAGE CONTROL LAW": "PUBLIC ORDER OFFENSE",
    "ANTICIPATORY OFFENSES": "OTHER",

    ARSON: "ARSON",

    "ASSAULT 3 & RELATED OFFENSES": "ASSAULT",
    "FELONY ASSAULT": "ASSAULT",
    "OFFENSES AGAINST THE PERSON": "ASSAULT",

    "BURGLAR'S TOOLS": "BURGLARY",
    BURGLARY: "BURGLARY",

    "CANNABIS RELATED OFFENSES": "DRUG OFFENSE",
    "DANGEROUS DRUGS": "DRUG OFFENSE",

    "CHILD ABANDONMENT/NON SUPPORT 1": "CHILD-RELATED OFFENSE",
    "OFFENSES RELATED TO CHILDREN": "CHILD-RELATED OFFENSE",

    "CRIMINAL MISCHIEF & RELATED OF": "VANDALISM",

    "CRIMINAL TRESPASS": "TRESPASSING",

    "DANGEROUS WEAPONS": "WEAPONS OFFENSE",
    "UNLAWFUL POSS. WEAP. ON SCHOOL": "WEAPONS OFFENSE",

    "DISORDERLY CONDUCT": "PUBLIC ORDER OFFENSE",
    GAMBLING: "PUBLIC ORDER OFFENSE",
    "LOITERING/GAMBLING (CARDS, DIC": "PUBLIC ORDER OFFENSE",
    "OFF. AGNST PUB ORD SENSBLTY &": "PUBLIC ORDER OFFENSE",
    "OFFENSES AGAINST PUBLIC SAFETY": "PUBLIC ORDER OFFENSE",
    "PROSTITUTION & RELATED OFFENSES": "PUBLIC ORDER OFFENSE",

    "ESCAPE 3": "OTHER",

    FORGERY: "FRAUD",
    FRAUDS: "FRAUD",
    "FRAUDULENT ACCOSTING": "FRAUD",
    "OFFENSES INVOLVING FRAUD": "FRAUD",
    "THEFT-FRAUD": "FRAUD",

    "GRAND LARCENY": "THEFT",
    "OTHER OFFENSES RELATED TO THEFT": "THEFT",
    "PETIT LARCENY": "THEFT",
    "POSSESSION OF STOLEN PROPERTY": "THEFT",
    JOSTLING: "THEFT",

    "GRAND LARCENY OF MOTOR VEHICLE": "MOTOR VEHICLE THEFT",
    "PETIT LARCENY OF MOTOR VEHICLE": "MOTOR VEHICLE THEFT",
    "UNAUTHORIZED USE OF A VEHICLE": "MOTOR VEHICLE THEFT",

    "HARRASSMENT 2": "HARASSMENT",

    "HOMICIDE-NEGLIGENT,UNCLASSIFIE": "HOMICIDE",
    "HOMICIDE-NEGLIGENT-VEHICLE": "HOMICIDE",
    "MURDER & NON-NEGL. MANSLAUGHTER": "HOMICIDE",

    "INTOXICATED & IMPAIRED DRIVING": "IMPAIRED DRIVING",
    "INTOXICATED/IMPAIRED DRIVING": "IMPAIRED DRIVING",

    "KIDNAPPING & RELATED OFFENSES": "KIDNAPPING",

    "OFFENSES AGAINST PUBLIC ADMINI": "PUBLIC ADMINISTRATION OFFENSE",

    RAPE: "SEXUAL OFFENSE",
    ROBBERY: "ROBBERY",
    "SEX CRIMES": "SEXUAL OFFENSE",

    "OTHER TRAFFIC INFRACTION": "TRAFFIC OFFENSE",
    "VEHICLE AND TRAFFIC LAWS": "TRAFFIC OFFENSE",

    "MISCELLANEOUS PENAL LAW": "OTHER",
    "NEW YORK CITY HEALTH CODE": "OTHER",
    "OTHER STATE LAWS": "OTHER",
    "OTHER STATE LAWS (NON PENAL LAW)": "OTHER",
  };

  const returnValue =
    categoryMap[crimeType] !== undefined ? categoryMap[crimeType] : "OTHER";

  return returnValue;
};

export const validateSource = (source) => {
  source = validateString(source, "source").toLowerCase();

  const validSources = ["all", "official", "user"];

  if (!validSources.includes(source))
    throw `Source must be one of: ${validSources.join(", ")}`;

  return source;
};

/* comments validation */

export const validateCommentText = (text) => {
  text = validateString(text, "Comment Text");

  if (text.length > 500) throw "Comment cannot be more than 500 characters";

  return text;
};

/* reportVotes validation */

export const validateVoteType = (type) => {
  type = validateString(type, "vote type").toLowerCase();

  if (type !== "upvote" && type !== "downvote")
    throw "Vote type must be either upvote or downvote";

  return type;
};

/* reportFlags validation */

export const validFlagReasons = ["Misinformation", "Inappropriate Report", "Other"];

export const validateFlagReason = (reason) => {
  reason = validateString(reason, "flag reason");

  const allowedFlagReason = validFlagReasons.find((validReason) => {
    return validReason.toLowerCase() === reason.toLowerCase();
  });

  if (!allowedFlagReason) throw `Flag must be one of: ${validFlagReasons.join(", ")}`;

  return allowedFlagReason;
};