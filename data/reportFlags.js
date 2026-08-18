import { ObjectId } from "mongodb";
import { reportFlags } from "../config/mongoCollections.js";
import * as validation from "./validation.js";
import * as userReportData from "./userReports.js";

const FLAG_THRESHOLD = 5;

export const flagUserReport = async (reportId, userId, reason) => {
  reportId = validation.validateId(reportId, "reportId");
  userId = validation.validateId(userId, "userId");
  reason = validation.validateFlagReason(reason);

  const userReport = await userReportData.getUserReportById(reportId);

  if (userReport.authorId === userId) throw "You cannot flag your own report";

  const reportFlagsCollection = await reportFlags();

  const existingFlag = await reportFlagsCollection.findOne({
    reportId: new ObjectId(reportId),
    userId: new ObjectId(userId),
  });

  if (existingFlag) throw "You have already flagged this report";

  const newFlag = {
    reportId: new ObjectId(reportId),
    userId: new ObjectId(userId),
    reason,
    createdAt: new Date(),
  };

  const insertedInfo = await reportFlagsCollection.insertOne(newFlag);

  if (!insertedInfo.acknowledged || !insertedInfo.insertedId)
    throw "Could not flag report";

  const flagCount = await getReportFlagCount(reportId);

  let hidden = false;

  if (flagCount >= FLAG_THRESHOLD) {
    await userReportData.hideUserReport(reportId);
    hidden = true;
  }

  return {
    _id: insertedInfo.insertedId.toString(),
    reportId,
    userId,
    reason,
    flagCount,
    hidden,
  };
};

export const getReportFlagCount = async (reportId) => {
  reportId = validation.validateId(reportId, "reportId");

  const reportFlagsCollection = await reportFlags();

  const flags = await reportFlagsCollection
    .find({
      reportId: new ObjectId(reportId),
    })
    .toArray();

  return flags.length;
};

export const getUserReportFlag = async (reportId, userId) => {
  reportId = validation.validateId(reportId, "reportId");
  userId = validation.validateId(userId, "userId");

  const reportFlagsCollection = await reportFlags();

  const flag = await reportFlagsCollection.findOne({
    reportId: new ObjectId(reportId),
    userId: new ObjectId(userId),
  });

  if (!flag) return null;

  flag._id = flag._id.toString();
  flag.reportId = flag.reportId.toString();
  flag.userId = flag.userId.toString();

  return flag;
};
