import { Router } from "express";
import * as userData from "../data/users.js";
import * as validation from "../data/validation.js";
import { handleApiError, handlePageError } from "./errorHandlers.js";

const router = Router();

router
    .route("/login")
    .get(async (req, res) => {})
    .post(async (req, res) => {});

router
    .route("/logout")
    .get(async (req, res) => {});

router
    .route("/register")
    .get(async (req, res) => {})
    .post(async (req, res) => {});

export default router;