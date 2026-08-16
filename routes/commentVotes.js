import { Router } from "express";
import * as commentVoteData from "../data/commentVotes.js";
import { handleApiError } from "./errorHandlers.js";

const router = Router();

const TEMP_USER_ID = "687000000000000000000001";

router.post("/:commentId", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ error: "There are no fields in the request body" });
    }

    const commentId = req.params.commentId;
    const type = req.body.type;

    const vote = await commentVoteData.voteOnComment(
      commentId,
      TEMP_USER_ID,
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