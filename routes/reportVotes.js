import { Router } from "express";
import * as reportVoteData from "../data/reportVotes.js";
import { handleApiError } from "./errorHandlers.js";

const router = Router();

router.post("/:reportId", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ error: "There are no fields in the request body" });
    }

    const reportId = req.params.reportId;
    const type = req.body.type;
    const userId = req.session.user.id;

    const vote = await reportVoteData.voteOnUserReport(
      reportId,
      userId,
      type,
    );

    const voteCounts = await reportVoteData.getReportVoteCounts(reportId);

    return res.status(200).json({ vote, voteCounts });
  } catch (e) {
    return handleApiError(e, res);
  }
});

export default router;