import { Router } from "express";
import * as userData from "../data/users.js";
import * as validation from "../data/validation.js";
import { handleApiError, handlePageError } from "./errorHandlers.js";

const router = Router();

router
    .route("/login")
    .get(async (req, res) => {
        return res.render("users/login", {
            title: "Login",
            partial: "user_script",
            stylesheet: "users.css",
        });
    })
    .post(async (req, res) => {
        let { username, password } = req.body;

        username = validation.validateString(username, "username");
        password = validation.validateString(password, "password");

        try {
            const user = await userData.authenticateUser(username, password);
            if (user.authenticated) {
                req.session.user = {
                    id: user.userId,
                    username: user.username,
                };
                return res.redirect("/");
            }else {
                return handlePageError(e, res, "Login");
            }
        } catch (e) {
            return res.status(400).render("users/login", {
                title: "Login",
                partial: "user_script",
                stylesheet: "users.css",
                error: "Invalid username or password",
            });
        }
    });

router
    .route("/logout")
    .get(async (req, res) => {
        req.session.destroy();

        return res.render("users/logout", {
            title: "Logout",
            partial: "user_script",
            stylesheet: "users.css",
        });
    });

router
    .route("/register")
    .get(async (req, res) => {
        return res.render("users/register", {
            title: "Register",
            partial: "user_script",
            stylesheet: "users.css",
            states: validation.validStates,
        });
    })
    .post(async (req, res) => {
        let { firstName, lastName, username, password, email, state, city, age } = req.body;

        firstName = validation.validateString(firstName, "firstName");
        lastName = validation.validateString(lastName, "lastName");
        username = validation.validateString(username, "username");
        password = validation.validateString(password, "password");
        email = validation.validateEmail(email);
        state = validation.validateState(state);
        city = validation.validateString(city, "city");
        age = validation.validateNumber(Number.parseInt(age), "Age", 0, 120);

        try {
            const newUser = await userData.createUser(firstName, lastName, username, password, email, state, city, age);

            if (newUser.userInserted) {
                return res.redirect("/user/login");
            }
        } catch (e) {
            console.error(e);
            return res.status(400).render("users/register", {
                title: "Register",
                partial: "user_script",
                stylesheet: "users.css",
                error: e.message || e,
                states: validation.validStates,
            });
        }
    });

export default router;