import { ObjectId, ReturnDocument } from "mongodb";
import { comments } from "../config/mongoCollections.js";
import * as validation from "./validation.js";
import * as userReportData from "./userReports.js";
import { NotFoundError, ForbiddenError } from "./error.js";

export const createComment = async (reportId, authorId, text) => {
  reportId = validation.validateId(reportId, "reportId");
  authorId = validation.validateId(authorId, "authorId");
  text = validation.validateCommentText(text);

  await userReportData.getUserReportById(reportId);

  const commentsCollection = await comments();

  const currentDate = new Date();

  const newComment = {
    reportId: new ObjectId(reportId),
    authorId: new ObjectId(authorId),
    text,
    createdAt: currentDate,
    updatedAt: currentDate,
  };

  const insertedInfo = await commentsCollection.insertOne(newComment);

  if (!insertedInfo.acknowledged || !insertedInfo.insertedId)
    throw "Could not add comment";

  return {
    ...newComment,
    _id: insertedInfo.insertedId.toString(),
    reportId: newComment.reportId.toString(),
    authorId: newComment.authorId.toString(),
  };
};

export const getCommentsByReport = async (reportId) => {
  reportId = validation.validateId(reportId, "reportId");

  await userReportData.getUserReportById(reportId);

  const commentsCollection = await comments();

  let commentList = await commentsCollection
    .find({ reportId: new ObjectId(reportId) })
    .sort({ createdAt: 1 })
    .toArray();

  commentList = commentList.map((comment) => {
    comment._id = comment._id.toString();
    comment.reportId = comment.reportId.toString();
    comment.authorId = comment.authorId.toString();

    return comment;
  });

  return commentList;
};

export const getCommentById = async (commentId) => {
  commentId = validation.validateId(commentId, "commentId");

  const commentsCollection = await comments();

  const comment = await commentsCollection.findOne({
    _id: new ObjectId(commentId),
  });

  if (!comment)
    throw new NotFoundError(`No comment found with id '${commentId}'`);

  comment._id = comment._id.toString();
  comment.reportId = comment.reportId.toString();
  comment.authorId = comment.authorId.toString();

  return comment;
};

export const updateComment = async (commentId, authorId, text) => {
  commentId = validation.validateId(commentId, "commentId");
  authorId = validation.validateId(authorId, "authorId");
  text = validation.validateCommentText(text);

  const comment = await getCommentById(commentId);

  if (comment.authorId !== authorId)
    throw new ForbiddenError("You cannot edit another user's comment");

  const commentsCollection = await comments();

  const updatedComment = await commentsCollection.findOneAndUpdate(
    {
      _id: new ObjectId(commentId),
    },
    {
      $set: {
        text,
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!updatedComment)
    throw new NotFoundError(`No comment found with id '${commentId}'`);

  updatedComment._id = updatedComment._id.toString();
  updatedComment.reportId = updatedComment.reportId.toString();
  updatedComment.authorId = updatedComment.authorId.toString();

  return updatedComment;
};

export const removeComment = async (commentId, authorId) => {
  commentId = validation.validateId(commentId, "commentId");
  authorId = validation.validateId(authorId, "authorId");

  const comment = await getCommentById(commentId);

  if (comment.authorId !== authorId)
    throw new ForbiddenError("You cannot delete another user's comment");

  const commentsCollection = await comments();

  const deletedInfo = await commentsCollection.findOneAndDelete({
    _id: new ObjectId(commentId),
    authorId: new ObjectId(authorId),
  });

  if (!deletedInfo)
    throw new NotFoundError(`No comment found with id '${commentId}'`);

  return {
    commentId,
    deleted: true,
  };
};