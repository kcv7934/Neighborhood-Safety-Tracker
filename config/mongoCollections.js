import { dbConnection } from "./mongoConnection.js";

const getCollectionFn = (collection) => {
  let _col = undefined;

  return async () => {
    if (!_col) {
      const db = await dbConnection();
      _col = await db.collection(collection);
    }

    return _col;
  };
};

export const userReports = getCollectionFn("userReports");
export const savedLocations = getCollectionFn("savedLocations");
export const officialReports = getCollectionFn("officialReports");
export const comments = getCollectionFn("comments");
export const reportVotes = getCollectionFn("reportVotes");
export const commentVotes = getCollectionFn("commentVotes");