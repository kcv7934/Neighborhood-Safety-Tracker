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
