import { Router } from "express";
import * as commentData from "../data/comments.js";
import { handleApiError } from "./errorHandlers.js";
import xss from "xss";

const router = Router();

router.route("/").post(async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ error: "There are no fields in the request body" });
    }

    const reportId = req.body.reportId;
    const cleanText = xss(req.body.text);
    const userId = req.session.user.id;

    const newComment = await commentData.createComment(
      reportId,
      userId,
      cleanText,
    );

    return res.status(201).json(newComment);
  } catch (e) {
    return handleApiError(e, res);
  }
});

router
  .route("/:commentId")
  .patch(async (req, res) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({ error: "There are no fields in the request body" });
      }

      const commentId = req.params.commentId;
      const cleanText = xss(req.body.text);
      const userId = req.session.user.id;

      const updatedComment = await commentData.updateComment(
        commentId,
        userId,
        cleanText,
      );

      return res.status(200).json(updatedComment);
    } catch (e) {
      return handleApiError(e, res);
    }
  })
  .delete(async (req, res) => {
    try {
      const commentId = req.params.commentId;
      const userId = req.session.user.id;

      const deletedInfo = await commentData.removeComment(
        commentId,
        userId,
      );

      return res.status(200).json(deletedInfo);
    } catch (e) {
      return handleApiError(e, res);
    }
  });

export default router;