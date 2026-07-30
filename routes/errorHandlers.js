import { NotFoundError, ForbiddenError } from "../data/error.js";

export const handleApiError = (e, res) => {
  if (e instanceof NotFoundError) {
    return res.status(404).json({ error: e.message });
  }

  if (e instanceof ForbiddenError) {
    return res.status(403).json({ error: e.message });
  }

  if (typeof e === "string") {
    return res.status(400).json({ error: e });
  }

  console.error(e);

  return res.status(500).json({
    error: "Internal server error",
  });
};

export const handlePageError = (e, res, dataName = "Resource") => {
  if (e instanceof NotFoundError) {
    return res.status(404).render("error", {
      title: `${dataName} Not Found`,
      statusCode: 404,
      error: e.message,
    });
  }

  if (e instanceof ForbiddenError) {
    return res.status(403).render("error", {
      title: "Forbidden",
      statusCode: 403,
      error: e.message,
    });
  }

  if (typeof e === "string") {
    return res.status(400).render("error", {
      title: `Invalid ${dataName}`,
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
