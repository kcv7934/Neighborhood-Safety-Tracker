import { Router } from "express";
import * as officialReportData from "../data/officialReports.js";
import { handleApiError, handlePageError } from "./errorHandlers.js";
import * as validation from "../data/validation.js";
import * as userReportData from "../data/userReports.js";


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

        const officialReport = await officialReportData.getOfficialReportById(reportId);

        // TODO: Create a view for the official report details page and render it here instead of returning JSON
        return res.status(200).json(officialReport);
    } catch (e) {
        return handleApiError(e, res);
    }
});

export default router;