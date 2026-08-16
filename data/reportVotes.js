import { ObjectId } from "mongodb";
import { reportVotes } from "../config/mongoCollections.js";
import * as validation from "./validation.js";
import * as userReportData from "./userReports.js";

export const voteOnUserReport = async (reportId, userId, type) => {
  reportId = validation.validateId(reportId, "reportId");
  userId = validation.validateId(userId, "userId");
  type = validation.validateVoteType(type);

  await userReportData.getUserReportById(reportId);

  const reportVotesCollection = await reportVotes();

  const existingVote = await reportVotesCollection.findOne({
    reportId: new ObjectId(reportId),
    userId: new ObjectId(userId),
  });

  const currentDate = new Date();

  if (existingVote) {
    if (existingVote.type === type) {
      return {
        ...existingVote,
        _id: existingVote._id.toString(),
        reportId: existingVote.reportId.toString(),
        userId: existingVote.userId.toString(),
      };
    }

    const updatedVote = await reportVotesCollection.findOneAndUpdate(
      {
        _id: existingVote._id,
      },
      {
        $set: {
          type,
          updatedAt: currentDate,
        },
      },
      {
        returnDocument: "after",
      },
    );

    if (!updatedVote) throw "Could not update report vote";

    updatedVote._id = updatedVote._id.toString();
    updatedVote.reportId = updatedVote.reportId.toString();
    updatedVote.userId = updatedVote.userId.toString();

    return updatedVote;
  }

  const newVote = {
    reportId: new ObjectId(reportId),
    userId: new ObjectId(userId),
    type,
    createdAt: currentDate,
    updatedAt: currentDate,
  };

  const insertedInfo = await reportVotesCollection.insertOne(newVote);

  if (!insertedInfo.acknowledged || !insertedInfo.insertedId) {
    throw "Could not add report vote";
  }

  return {
    ...newVote,
    _id: insertedInfo.insertedId.toString(),
    reportId: newVote.reportId.toString(),
    userId: newVote.userId.toString(),
  };
};

export const getReportVoteCounts = async (reportId) => {
  reportId = validation.validateId(reportId, "reportId");

  await userReportData.getUserReportById(reportId);

  const reportVotesCollection = await reportVotes();

  const votes = await reportVotesCollection
    .find({
      reportId: new ObjectId(reportId),
    })
    .toArray();

  let upvotes = 0;
  let downvotes = 0;

  for (const vote of votes) {
    if (vote.type === "upvote") {
      upvotes++;
    } else if (vote.type === "downvote") {
      downvotes++;
    }
  }

  return {
    upvotes,
    downvotes,
  };
};

export const getUserReportVote = async (reportId, userId) => {
  reportId = validation.validateId(reportId, "reportId");
  userId = validation.validateId(userId, "userId");

  const reportVotesCollection = await reportVotes();

  const vote = await reportVotesCollection.findOne({
    reportId: new ObjectId(reportId),
    userId: new ObjectId(userId),
  });

  if (!vote) return null;

  vote._id = vote._id.toString();
  vote.reportId = vote.reportId.toString();
  vote.userId = vote.userId.toString();

  return vote;
};
