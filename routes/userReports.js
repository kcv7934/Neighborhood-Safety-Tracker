import { Router } from "express";
import * as userReportData from "../data/userReports.js";
import { NotFoundError } from "../data/error.js";
import * as validation from "../data/validation.js";

const router = Router();

const TEMP_AUTHOR_ID = "687000000000000000000001";

const handleApiError = (e, res) => {
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

const handlePageError = (e, res) => {
  if (e instanceof NotFoundError) {
    return res.status(404).render("error", {
      title: "Report Not Found",
      statusCode: 404,
      error: e.message,
    });
  }

  if (typeof e === "string") {
    return res.status(400).render("error", {
      title: "Invalid Report",
      statusCode: 400,
      error: e,
    });
  }

  console.error(e);

  return res.status(500).render("error", {
    title: "Server Error",
    statusCode: 500,
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
      const { category, address, borough, description } = req.body;

      const newUserReport = await userReportData.createUserReport(
        authorId,
        category,
        address,
        borough,
        description,
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
  });
});

router.get("/my-reports", async (req, res) => {
  try {
    // TODO: temporary authorId to be used until users collection is implemented
    const authorId = TEMP_AUTHOR_ID;

    const reports = await userReportData.getUserReportsByAuthor(authorId);

    return res.render("userReports/myReports", {
      title: "My Reports",
      reports,
    });
  } catch (e) {
    return handlePageError(e, res);
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

      return res.render("userReports/reportDetails", {
        title: "User Report Detail",
        report: preparedUserReport,
      });
    } catch (e) {
      return handlePageError(e, res);
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
      return handleApiError(e, res);
    }
  })
  .delete(async (req, res) => {
    try {
      const id = req.params.userReportId;
      const deletedInfo = await userReportData.removeUserReport(id);
      return res.status(200).json(deletedInfo);
    } catch (e) {
      return handleApiError(e, res);
    }
  });

export default router;
