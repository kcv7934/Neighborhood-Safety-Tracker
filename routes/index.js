import userReportRoutes from "./userReports.js";
import savedLocationRoutes from "./savedLocations.js";

const constructorMethod = (app) => {
  app.get("/", (req, res) => {
    res.json({ message: "Neighborhood Safety Tracker" });
  });

  app.use("/user-reports", userReportRoutes);
  app.use("/saved-locations", savedLocationRoutes);

  app.use((req, res) => {
    res.status(404).json({
      error: "Route not found",
    });
  });
};

export default constructorMethod;
