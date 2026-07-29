import { Router } from "express";
import * as savedLocationData from "../data/savedLocations.js";
import { handleApiError, handlePageError } from "./errorHandlers.js";

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

router
  .route("/:savedLocationId")
  .get(async (req, res) => {
    try {
      const id = req.params.savedLocationId;

      const savedLocation = await savedLocationData.getSavedLocationByIdForUser(
        id,
        TEMP_AUTHOR_ID,
      );

      return res.status(200).json(savedLocation);
    } catch (e) {
      return handleApiError(e, res);
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
