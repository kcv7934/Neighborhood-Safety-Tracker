import userReportRoutes from "./userReports.js";
import savedLocationRoutes from "./savedLocations.js";
import userRoutes from "./users.js";
import * as savedLocationData from "../data/savedLocations.js";
import * as userReportData from "../data/userReports.js";
import { handlePageError } from "./errorHandlers.js";

const DASHBOARD_LOCATION_LIMIT = 3;

const constructorMethod = (app) => {
  app.get("/", async (req, res) => {
    try {
      const savedLocations =
        await savedLocationData.getSavedLocationsByUser(req.session.user.id);

      const dashboardSavedLocations = savedLocations.slice(
        0,
        DASHBOARD_LOCATION_LIMIT,
      );

      const userReports =
        await userReportData.getUserReportsByAuthor(req.session.user.id);

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
  app.use("/user", userRoutes);
  app.use("/saved-locations", savedLocationRoutes);

  app.use((req, res) => {
    return res.status(404).render("error", {
      title: "Page Not Found",
      statusCode: 404,
      error: "The requested page could not be found",
    });
  });
};

export default constructorMethod;
