import { Router } from "express";
import * as userReportData from "../data/userReports.js";
import * as validation from "../data/validation.js";
import { handleApiError, handlePageError } from "./errorHandlers.js";
import xss from "xss";
import * as commentData from "../data/comments.js";
import * as reportVoteData from "../data/reportVotes.js";
import * as commentVoteData from "../data/commentVotes.js";

const router = Router();

const TEMP_AUTHOR_ID = "687000000000000000000001";

router
  .route("/")
  .get(async (req, res) => {
    try {
      const userReportsList = await userReportData.getAllUserReports();
      return res.status(200).json(userReportsList);
    } catch (e) {
      return handleApiError(e, res);
    }
  })
  .post(async (req, res) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({ error: "There are no fields in the request body" });
      }

      // TODO: replace with req.session.user._id when authentication is implemented
      const authorId = TEMP_AUTHOR_ID;

      const cleanCategory = xss(req.body.category);
      const cleanAddress = xss(req.body.address);
      const cleanBorough = xss(req.body.borough);
      const cleanDescription = xss(req.body.description);

      const newUserReport = await userReportData.createUserReport(
        authorId,
        cleanCategory,
        cleanAddress,
        cleanBorough,
        cleanDescription,
      );

      return res.status(201).json(newUserReport);
    } catch (e) {
      return handleApiError(e, res);
    }
  });

router.get("/create", (req, res) => {
  return res.render("userReports/create", {
    title: "Create User Report",
    categories: validation.validCategories,
    boroughs: validation.validBoroughs,
    partial: "user_report_script",
    stylesheet: "userReports.css",
  });
});

router.get("/my-reports", async (req, res) => {
  try {
    // TODO: temporary authorId to be used until users collection is implemented
    const authorId = TEMP_AUTHOR_ID;

    const reports = await userReportData.getUserReportsByAuthor(authorId);

    const successMessage =
      req.query.deleted === "true" ? "Report deleted successfully" : null;

    return res.render("userReports/myReports", {
      title: "My Reports",
      reports,
      successMessage,
      stylesheet: "userReports.css",
    });
  } catch (e) {
    return handlePageError(e, res, "Report");
  }
});

router.get("/:userReportId/edit", async (req, res) => {
  try {
    const id = req.params.userReportId;

    const userReport = await userReportData.getUserReportByIdForAuthor(
      id,
      TEMP_AUTHOR_ID,
    );

    const currentCategory = userReport.category;

    const categories = validation.validCategories.map((category) => {
      return {
        value: category,
        selected: category === currentCategory,
      };
    });

    const currentBorough = userReport.borough;

    const boroughs = validation.validBoroughs.map((borough) => {
      return {
        value: borough,
        selected: borough === currentBorough,
      };
    });

    const streetAddress = userReport.address.split(",")[0].trim();

    const preparedUserReport = {
      ...userReport,
      streetAddress,
    };

    return res.render("userReports/edit", {
      title: "Edit User Report",
      report: preparedUserReport,
      categories,
      boroughs,
      partial: "user_report_script",
      stylesheet: "userReports.css",
    });
  } catch (e) {
    return handlePageError(e, res, "Report");
  }
});

router
  .route("/:userReportId")
  .get(async (req, res) => {
    try {
      const id = req.params.userReportId;

      const userReport = await userReportData.getUserReportById(id);

      const preparedUserReport = {
        ...userReport,
        createdAt: userReport.createdAt.toLocaleString(),
        updatedAt: userReport.updatedAt.toLocaleString(),
      };

      const comments = await commentData.getCommentsByReport(id);

      const preparedComments = [];

      for (const comment of comments) {
        const commentVoteCounts = await commentVoteData.getCommentVoteCounts(
          comment._id,
        );

        const userCommentVote = await commentVoteData.getUserCommentVote(
          comment._id,
          TEMP_AUTHOR_ID,
        );

        let currentCommentVoteType = null;

        if (userCommentVote) currentCommentVoteType = userCommentVote.type;

        preparedComments.push({
          ...comment,
          createdAt: comment.createdAt.toLocaleString(),
          updatedAt: comment.updatedAt.toLocaleString(),
          isOwner: comment.authorId === TEMP_AUTHOR_ID,
          voteCounts: commentVoteCounts,
          currentVoteType: currentCommentVoteType,
        });
      }

      const userReportVote = await reportVoteData.getUserReportVote(
        id,
        TEMP_AUTHOR_ID,
      );

      const reportVoteCounts = await reportVoteData.getReportVoteCounts(id);

      let currentReportVoteType = null;

      if (userReportVote) currentReportVoteType = userReportVote.type;

      let successMessage = null;

      if (req.query.created === "true") {
        successMessage = "Report created successfully";
      } else if (req.query.updated === "true") {
        successMessage = "Report updated successfully";
      }

      return res.render("userReports/reportDetails", {
        title: "User Report Detail",
        report: preparedUserReport,
        isOwner: userReport.authorId === TEMP_AUTHOR_ID,
        successMessage,
        comments: preparedComments,
        voteCounts: reportVoteCounts,
        currentVoteType: currentReportVoteType,
        partial: "user_report_script",
        stylesheet: "userReports.css",
      });
    } catch (e) {
      return handlePageError(e, res, "Report");
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

      const updates = {};

      if (req.body.category !== undefined) {
        updates.category = xss(req.body.category);
      }

      if (req.body.address !== undefined) {
        updates.address = xss(req.body.address);
      }

      if (req.body.borough !== undefined) {
        updates.borough = xss(req.body.borough);
      }

      if (req.body.description !== undefined) {
        updates.description = xss(req.body.description);
      }

      const updatedUserReport = await userReportData.updateUserReport(
        id,
        TEMP_AUTHOR_ID,
        updates,
      );
      return res.status(200).json(updatedUserReport);
    } catch (e) {
      return handleApiError(e, res);
    }
  })
  .delete(async (req, res) => {
    try {
      const id = req.params.userReportId;
      const deletedInfo = await userReportData.removeUserReport(
        id,
        TEMP_AUTHOR_ID,
      );
      return res.status(200).json(deletedInfo);
    } catch (e) {
      return handleApiError(e, res);
    }
  });

export default router;
