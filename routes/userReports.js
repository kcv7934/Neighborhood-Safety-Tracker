import { Router } from "express";
import * as userReportData from "../data/userReports.js";
import { NotFoundError } from "../data/error.js";

const router = Router();

const handleError = (e, res) => {
  if (e instanceof NotFoundError) {
    return res.status(404).json({ error: e.message });
  }

  if (typeof e === "string") {
    return res.status(400).json({ error: e });
  }

  console.error(e);

  return res.status(500).json({
    error: "Internal server error",
  });
};

router
  .route("/")
  .get(async (req, res) => {
    try {
      const userReportsList = await userReportData.getAllUserReports();
      return res.status(200).json(userReportsList);
    } catch (e) {
      return handleError(e, res);
    }
  })
  .post(async (req, res) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({ error: "There are no fields in the request body" });
      }

      // TODO authenticate authorId from session

      const { authorId, category, address, borough, description } = req.body;

      const newUserReport = await userReportData.createUserReport(
        authorId,
        category,
        address,
        borough,
        description,
      );

      return res.status(201).json(newUserReport);
    } catch (e) {
      return handleError(e, res);
    }
  });

router
  .route("/:userReportId")
  .get(async (req, res) => {
    try {
      const id = req.params.userReportId;

      const userReport = await userReportData.getUserReportById(id);
      return res.status(200).json(userReport);
    } catch (e) {
      return handleError(e, res);
    }
  })
  .patch(async (req, res) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({ error: "There are no fields in the request body" });
      }
      const id = req.params.userReportId;
      const updates = req.body;
      const updatedUserReport = await userReportData.updateUserReport(
        id,
        updates,
      );
      return res.status(200).json(updatedUserReport);
    } catch (e) {
      return handleError(e, res);
    }
  })
  .delete(async (req, res) => {
    try {
      const id = req.params.userReportId;
      const deletedInfo = await userReportData.removeUserReport(id);
      return res.status(200).json(deletedInfo);
    } catch (e) {
      return handleError(e, res);
    }
  });

export default router;
