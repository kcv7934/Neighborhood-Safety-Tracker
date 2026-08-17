import userReportRoutes from "./userReports.js";
import savedLocationRoutes from "./savedLocations.js";
import officialReportRoutes from "./officialReports.js";
import searchRoutes from "./search.js";
import commentRoutes from "./comments.js";
import reportVoteRoutes from "./reportVotes.js";
import commentVoteRoutes from "./commentVotes.js";
import reportFlagRoutes from "./reportFlags.js";
import * as savedLocationData from "../data/savedLocations.js";
import * as userReportData from "../data/userReports.js";
import { handlePageError } from "./errorHandlers.js";

const TEMP_AUTHOR_ID = "687000000000000000000001";

const DASHBOARD_LOCATION_LIMIT = 3;

const constructorMethod = (app) => {
  app.get("/", async (req, res) => {
    try {
      const savedLocations =
        await savedLocationData.getSavedLocationsByUser(TEMP_AUTHOR_ID);

      const dashboardSavedLocations = savedLocations.slice(
        0,
        DASHBOARD_LOCATION_LIMIT,
      );

      const userReports =
        await userReportData.getUserReportsByAuthor(TEMP_AUTHOR_ID);

      return res.render("home", {
        title: "Neighborhood Safety Tracker",
        savedLocations: dashboardSavedLocations,
        savedLocationCount: savedLocations.length,
        userReportCount: userReports.length,
      });
    } catch (e) {
      return handlePageError(e, res, "Dashboard");
    }
  });

  app.use("/user-reports", userReportRoutes);
  app.use("/saved-locations", savedLocationRoutes);
  app.use("/official-reports", officialReportRoutes);
  app.use("/search", searchRoutes);
  app.use("/comments", commentRoutes);
  app.use("/report-votes", reportVoteRoutes);
  app.use("/comment-votes", commentVoteRoutes);
  app.use("/report-flags", reportFlagRoutes);

  app.use((req, res) => {
    return res.status(404).render("error", {
      title: "Page Not Found",
      statusCode: 404,
      error: "The requested page could not be found",
    });
  });
};

export default constructorMethod;
