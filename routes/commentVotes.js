import { Router } from "express";
import * as commentVoteData from "../data/commentVotes.js";
import { handleApiError } from "./errorHandlers.js";

const router = Router();

router.post("/:commentId", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ error: "There are no fields in the request body" });
    }

    const commentId = req.params.commentId;
    const type = req.body.type;
    const userId = req.session.user.id;

    const vote = await commentVoteData.voteOnComment(
      commentId,
      userId,
      type,
    );

    const voteCounts = await commentVoteData.getCommentVoteCounts(commentId);

    return res.status(200).json({
      vote,
      voteCounts,
    });
  } catch (e) {
    return handleApiError(e, res);
  }
});

export default router;