import { ObjectId } from "mongodb";
import { commentVotes } from "../config/mongoCollections.js";
import * as validation from "./validation.js";
import * as commentData from "./comments.js";

export const voteOnComment = async (commentId, userId, type) => {
  commentId = validation.validateId(commentId, "commentId");
  userId = validation.validateId(userId, "userId");
  type = validation.validateVoteType(type);

  const comment = await commentData.getCommentById(commentId);

  if (comment.authorId === userId) throw "You cannot vote on your own comment";

  const commentVotesCollection = await commentVotes();

  const existingVote = await commentVotesCollection.findOne({
    commentId: new ObjectId(commentId),
    userId: new ObjectId(userId),
  });

  const currentDate = new Date();

  if (existingVote) {
    if (existingVote.type === type) {
      return {
        ...existingVote,
        _id: existingVote._id.toString(),
        commentId: existingVote.commentId.toString(),
        userId: existingVote.userId.toString(),
      };
    }

    const updatedVote = await commentVotesCollection.findOneAndUpdate(
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

    if (!updatedVote) throw "Could not update comment vote";

    updatedVote._id = updatedVote._id.toString();
    updatedVote.commentId = updatedVote.commentId.toString();
    updatedVote.userId = updatedVote.userId.toString();

    return updatedVote;
  }

  const newVote = {
    commentId: new ObjectId(commentId),
    userId: new ObjectId(userId),
    type,
    createdAt: currentDate,
    updatedAt: currentDate,
  };

  const insertedInfo = await commentVotesCollection.insertOne(newVote);

  if (!insertedInfo.acknowledged || !insertedInfo.insertedId)
    throw "Could not add comment vote";

  return {
    ...newVote,
    _id: insertedInfo.insertedId.toString(),
    commentId: newVote.commentId.toString(),
    userId: newVote.userId.toString(),
  };
};

export const getCommentVoteCounts = async (commentId) => {
  commentId = validation.validateId(commentId, "commentId");

  await commentData.getCommentById(commentId);

  const commentVotesCollection = await commentVotes();

  const votes = await commentVotesCollection
    .find({
      commentId: new ObjectId(commentId),
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

export const getUserCommentVote = async (commentId, userId) => {
  commentId = validation.validateId(commentId, "commentId");
  userId = validation.validateId(userId, "userId");

  const commentVotesCollection = await commentVotes();

  const vote = await commentVotesCollection.findOne({
    commentId: new ObjectId(commentId),
    userId: new ObjectId(userId),
  });

  if (!vote) return null;

  vote._id = vote._id.toString();
  vote.commentId = vote.commentId.toString();
  vote.userId = vote.userId.toString();

  return vote;
};
