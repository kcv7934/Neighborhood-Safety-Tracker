import userReportRoutes from "./userReports.js";

const constructorMethod = (app) => {
  app.get("/", (req, res) => {
    res.json({ message: "Neighborhood Safety Tracker" });
  });

  app.use("/userReports", userReportRoutes);

  app.use((req, res) => {
    res.status(404).json({
      error: "Route not found",
    });
  });
};

export default constructorMethod;
