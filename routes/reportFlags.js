import { Router } from "express";
import * as reportFlagData from "../data/reportFlags.js";
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
    const reason = req.body.reason;
    const userId = req.session.user.id;

    const flagInfo = await reportFlagData.flagUserReport(
      reportId,
      userId,
      reason,
    );

    return res.status(200).json(flagInfo);
  } catch (e) {
    return handleApiError(e, res);
  }
});

export default router;