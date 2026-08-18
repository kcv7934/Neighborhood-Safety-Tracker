import { Router } from "express";
import * as savedLocationData from "../data/savedLocations.js";
import * as officialReportData from "../data/officialReports.js";
import { handleApiError, handlePageError } from "./errorHandlers.js";
import * as validation from "../data/validation.js";
import * as userReportData from "../data/userReports.js";
import { reverseGeocodeCoordinates } from "../data/geocoding.js";
import xss from "xss";

const router = Router();

router
  .route("/")
  .get(async (req, res) => {
    try {
      let tag;

      if (req.query.tag !== undefined) {
        tag = xss(req.query.tag);
      }

      const savedLocationList = await savedLocationData.getSavedLocationsByUser(
        req.session.user.id,
        tag,
      );

      return res.status(200).json(savedLocationList);
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

      const cleanLabel = xss(req.body.label);
      const cleanAddress = xss(req.body.address);
      const cleanBorough = xss(req.body.borough);

      let cleanTags = [];

      if (req.body.tags !== undefined) {
        cleanTags = req.body.tags.map((tag) => {
          return xss(tag);
        });
      }

      const newSavedLocation = await savedLocationData.createSavedLocation(
        req.session.user.id,
        cleanLabel,
        cleanAddress,
        cleanBorough,
        cleanTags,
      );

      return res.status(201).json(newSavedLocation);
    } catch (e) {
      return handleApiError(e, res);
    }
  });

router.get("/create", async (req, res) => {
  try {
    let address = "";
    let selectedBorough = "";

    if (
      req.query.userReportId !== undefined &&
      req.query.officialReportId !== undefined
    ) {
      throw "Only one report can be used to save a location, two were provided";
    }

    if (req.query.userReportId !== undefined) {
      const userReport = await userReportData.getUserReportById(
        req.query.userReportId,
      );

      address = userReport.address;
      selectedBorough = userReport.borough;
    } else if (req.query.officialReportId !== undefined) {
      const officialReport = await officialReportData.getOfficialReportById(
        req.query.officialReportId,
      );

      const location = await reverseGeocodeCoordinates(
        officialReport.latitude,
        officialReport.longitude,
      );

      address = location.address;
      selectedBorough = officialReport.borough;
    }

    const boroughs = validation.validBoroughs.map((borough) => {
      return {
        value: borough,
        selected: borough === selectedBorough,
      };
    });

    return res.render("savedLocations/create", {
      title: "Save a Location",
      address,
      boroughs,
      partial: "saved_location_script",
      stylesheet: "savedLocations.css",
    });
  } catch (e) {
    return handlePageError(e, res, "Saved Location");
  }
});

router.get("/my-locations", async (req, res) => {
  try {
    let tag;

    if (req.query.tag !== undefined) {
      tag = xss(req.query.tag);
    }

    const mySavedLocations = await savedLocationData.getSavedLocationsByUser(
      req.session.user.id,
      tag,
    );

    const successMessage =
      req.query.deleted === "true"
        ? "Saved location deleted successfully"
        : null;

    return res.render("savedLocations/myLocations", {
      title: "My Saved Locations",
      mySavedLocations,
      selectedTag: tag || "",
      hasFilter: tag !== undefined,
      successMessage,
      stylesheet: "savedLocations.css",
    });
  } catch (e) {
    return handlePageError(e, res, "Saved Location");
  }
});

router.get("/:savedLocationId/edit", async (req, res) => {
  try {
    const id = req.params.savedLocationId;

    const savedLocation = await savedLocationData.getSavedLocationByIdForUser(
      id,
      req.session.user.id,
    );

    const currentBorough = validation.validBoroughs.find((borough) => {
      return savedLocation.address.includes(`, ${borough},`);
    });

    const boroughs = validation.validBoroughs.map((borough) => {
      return {
        value: borough,
        selected: borough === currentBorough,
      };
    });

    const streetAddress = savedLocation.address.split(",")[0].trim();

    const preparedLocation = {
      ...savedLocation,
      streetAddress,
      tagsStr: savedLocation.tags.join(", "),
    };

    return res.render("savedLocations/edit", {
      title: "Edit Saved Location",
      location: preparedLocation,
      boroughs,
      partial: "saved_location_script",
      stylesheet: "savedLocations.css",
    });
  } catch (e) {
    return handlePageError(e, res, "Saved Location");
  }
});

router.get("/:savedLocationId/nearby-user-reports", async (req, res) => {
  try {
    const savedLocationId = req.params.savedLocationId;

    const { category, startDate, endDate } = req.query;

    const savedLocation = await savedLocationData.getSavedLocationByIdForUser(
      savedLocationId,
      req.session.user.id,
    );

    const nearbyReports = await userReportData.getNearbyUserReports(
      savedLocation.latitude,
      savedLocation.longitude,
      category,
      startDate,
      endDate,
    );

    return res.status(200).json(nearbyReports);
  } catch (e) {
    return handleApiError(e, res);
  }
});

router.get("/:savedLocationId/nearby-official-reports", async (req, res) => {
  try {
    const savedLocationId = req.params.savedLocationId;

    const { category, startDate, endDate } = req.query;

    const savedLocation = await savedLocationData.getSavedLocationByIdForUser(
      savedLocationId,
      TEMP_AUTHOR_ID,
    );

    const nearbyReports = await officialReportData.getNearbyOfficialReports(
      savedLocation.latitude,
      savedLocation.longitude,
      category,
      startDate,
      endDate,
    );

    return res.status(200).json(nearbyReports);
  } catch (e) {
    return handleApiError(e, res);
  }
});

router
  .route("/:savedLocationId")
  .get(async (req, res) => {
    try {
      const id = req.params.savedLocationId;

      const savedLocation = await savedLocationData.getSavedLocationByIdForUser(
        id,
        req.session.user.id,
      );

      let successMessage = null;

      if (req.query.created === "true") {
        successMessage = "Saved location created successfully";
      } else if (req.query.updated === "true") {
        successMessage = "Saved location updated successfully";
      }

      return res.render("savedLocations/locationDetails", {
        title: "Saved Location Details",
        location: savedLocation,
        categories: validation.validCategories,
        successMessage,
        leaflet: true,
        stylesheet: "savedLocations.css",
        partial: "saved_location_map_script",
      });
    } catch (e) {
      return handlePageError(e, res, "Saved Location");
    }
  })
  .patch(async (req, res) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({ error: "There are no fields in the request body" });
      }

      const id = req.params.savedLocationId;

      const updates = {};

      if (req.body.label !== undefined) {
        updates.label = xss(req.body.label);
      }

      if (req.body.address !== undefined) {
        updates.address = xss(req.body.address);
      }

      if (req.body.borough !== undefined) {
        updates.borough = xss(req.body.borough);
      }

      if (req.body.tags !== undefined) {
        updates.tags = req.body.tags.map((tag) => {
          return xss(tag);
        });
      }

      const updatedSavedLocation = await savedLocationData.updateSavedLocation(
        id,
        req.session.user.id,
        updates,
      );

      return res.status(200).json(updatedSavedLocation);
    } catch (e) {
      return handleApiError(e, res);
    }
  })
  .delete(async (req, res) => {
    try {
      const id = req.params.savedLocationId;

      const deletedInfo = await savedLocationData.removeSavedLocation(
        id,
        req.session.user.id,
      );

      return res.status(200).json(deletedInfo);
    } catch (e) {
      return handleApiError(e, res);
    }
  });

export default router;
