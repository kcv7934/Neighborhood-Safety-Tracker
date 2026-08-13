import { Router } from "express";
import * as officialReportData from "../data/officialReports.js";
import { handleApiError, handlePageError } from "./errorHandlers.js";
import { reverseGeocodeCoordinates } from "../data/geocoding.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const officialReportList = await officialReportData.getAllOfficialReports();
    return res.status(200).json(officialReportList);
  } catch (e) {
    return handleApiError(e, res);
  }
});

router.get("/:reportId", async (req, res) => {
  try {
    const reportId = req.params.reportId;

    const officialReport =
      await officialReportData.getOfficialReportById(reportId);

    let approximateAddress = "Address unavailable";

    try {
      const location = await reverseGeocodeCoordinates(
        officialReport.latitude,
        officialReport.longitude,
      );

      approximateAddress = location.address;
    } catch (e) {
      console.error(e);
    }

    const preparedOfficialReport = {
      ...officialReport,
      approximateAddress,
      dateOccurred: new Date(officialReport.dateOccurred).toLocaleDateString(),
    };

    return res.render("officialReports/reportDetails", {
      title: "Official Report Details",
      report: preparedOfficialReport,
    });
  } catch (e) {
    return handlePageError(e, res, "Official Report");
  }
});

export default router;
