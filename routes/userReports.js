import { Router } from "express";
import * as userReportData from "../data/userReports.js";
import * as validation from "../data/validation.js";
import { handleApiError, handlePageError } from "./errorHandlers.js";
import xss from "xss";

const router = Router();

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

      const authorId = req.session.user.id;

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
    const authorId = req.session.user.id;

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
      req.session.user.id,
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

      let successMessage = null;

      if (req.query.created === "true") {
        successMessage = "Report created successfully";
      } else if (req.query.updated === "true") {
        successMessage = "Report updated successfully";
      }

      return res.render("userReports/reportDetails", {
        title: "User Report Detail",
        report: preparedUserReport,
        isOwner: userReport.authorId === req.session.user.id,
        successMessage,
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
        req.session.user.id,
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
        req.session.user.id,
      );
      return res.status(200).json(deletedInfo);
    } catch (e) {
      return handleApiError(e, res);
    }
  });

export default router;
