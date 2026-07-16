import { Router } from "express";

const router = Router();

router.route("/").get(async (req, res) => {
  res.json({
    message: "userReports route is working",
  });
});

export default router;
