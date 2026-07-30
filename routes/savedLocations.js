import { Router } from "express";
import * as savedLocationData from "../data/savedLocations.js";
import { handleApiError, handlePageError } from "./errorHandlers.js";
import * as validation from "../data/validation.js";
import * as userReportData from "../data/userReports.js";

const router = Router();

const TEMP_AUTHOR_ID = "687000000000000000000001";

router
  .route("/")
  .get(async (req, res) => {
    try {
      const tag = req.query.tag;

      const savedLocationList = await savedLocationData.getSavedLocationsByUser(
        TEMP_AUTHOR_ID,
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

      const { label, address, borough, tags = [] } = req.body;

      const newSavedLocation = await savedLocationData.createSavedLocation(
        TEMP_AUTHOR_ID,
        label,
        address,
        borough,
        tags,
      );

      return res.status(201).json(newSavedLocation);
    } catch (e) {
      return handleApiError(e, res);
    }
  });

router.get("/create", (req, res) => {
  return res.render("savedLocations/create", {
    title: "Save a Location",
    boroughs: validation.validBoroughs,
    partial: "saved_location_script",
  });
});

router.get("/my-locations", async (req, res) => {
  try {
    const tag = req.query.tag;

    const mySavedLocations = await savedLocationData.getSavedLocationsByUser(
      TEMP_AUTHOR_ID,
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
      TEMP_AUTHOR_ID,
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

    const preparedLocation = {
      ...savedLocation,
      tagsStr: savedLocation.tags.join(", "),
    };

    return res.render("savedLocations/edit", {
      title: "Edit Saved Location",
      location: preparedLocation,
      boroughs,
      partial: "saved_location_script",
    });
  } catch (e) {
    return handlePageError(e, res, "Saved Location");
  }
});

router.get("/:savedLocationId/nearby-user-reports", async (req, res) => {
  try {
    const id = req.params.savedLocationId;

    const savedLocation = await savedLocationData.getSavedLocationByIdForUser(
      id,
      TEMP_AUTHOR_ID,
    );

    const nearbyReports = await userReportData.getNearbyUserReports(
      savedLocation.latitude,
      savedLocation.longitude,
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
        TEMP_AUTHOR_ID,
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
        successMessage,
        leaflet: true,
        stylesheet: "savedLocationMap.css",
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

      const updatedSavedLocation = await savedLocationData.updateSavedLocation(
        id,
        TEMP_AUTHOR_ID,
        req.body,
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
        TEMP_AUTHOR_ID,
      );

      return res.status(200).json(deletedInfo);
    } catch (e) {
      return handleApiError(e, res);
    }
  });

export default router;
