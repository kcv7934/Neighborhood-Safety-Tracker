import { Router } from "express";
import * as userData from "../data/users.js";
import * as validation from "../data/validation.js";
import { handleApiError, handlePageError } from "./errorHandlers.js";

const router = Router();

router
  .route("/login")
  .get(async (req, res) => {
    if (req.query.deleted) {
      return res.render("users/login", {
        title: "Login",
        partial: "user_script",
        stylesheet: "users.css",
        successMessage:
          "Your account has been deleted successfully. Please log in or register a new account.",
      });
    } else {
      return res.render("users/login", {
        title: "Login",
        partial: "user_script",
        stylesheet: "users.css",
      });
    }
  })
  .post(async (req, res) => {
    try {
      let { username, password } = req.body;

      username = validation.validateString(username, "username");
      password = validation.validateString(password, "password");

      const user = await userData.authenticateUser(username, password);
      if (user.authenticated) {
        req.session.user = {
          id: user.userId,
          username: user.username,
        };
        return res.redirect("/user/profile");
      }

      return res.status(400).render("users/login", {
        title: "Login",
        partial: "user_script",
        stylesheet: "users.css",
        error: "Invalid username or password",
      });
    } catch (e) {
      return res.status(400).render("users/login", {
        title: "Login",
        partial: "user_script",
        stylesheet: "users.css",
        error: "Invalid username or password",
      });
    }
  });

router.route("/logout").get(async (req, res) => {
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
    try {
      let {
        firstName,
        lastName,
        username,
        password,
        confirmPassword,
        email,
        state,
        city,
        age,
      } = req.body;

      firstName = validation.validateString(firstName, "firstName");
      lastName = validation.validateString(lastName, "lastName");
      username = validation.validateString(username, "username");
      password = validation.validatePassword(password);
      confirmPassword = validation.validateString(
        confirmPassword,
        "confirmPassword",
      );
      if (password !== confirmPassword) throw "Passwords do not match";

      email = validation.validateEmail(email);
      state = validation.validateState(state);
      city = validation.validateString(city, "city");
      age = validation.validateNumber(Number(age), "Age", 0, 120);

      const newUser = await userData.createUser(
        firstName,
        lastName,
        username,
        password,
        email,
        state,
        city,
        age,
      );

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

router.route("/profile").get(async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/user/login");
  } else {
    try {
      const user = await userData.getUserById(req.session.user.id);

      if (req.query.edited) {
        return res.render("users/profile", {
          title: "Profile",
          partial: "user_script",
          stylesheet: "users.css",
          user: user,
          successMessage: "Profile updated successfully",
        });
      } else {
        return res.render("users/profile", {
          title: "Profile",
          partial: "user_script",
          stylesheet: "users.css",
          user: user,
        });
      }
    } catch (e) {
      handlePageError(e, res, "Profile");
    }
  }
});

router
  .route("/profile/edit")
  .get(async (req, res) => {
    if (!req.session.user) {
      return res.redirect("/user/login");
    }

    try {
      const user = await userData.getUserById(req.session.user.id);

      const preparedStates = validation.validStates.map((state) => {
        return {
          value: state,
          selected: state === user.state,
        };
      });

      return res.render("users/editProfile", {
        title: "Edit Profile",
        partial: "user_script",
        stylesheet: "users.css",
        user: user,
        states: preparedStates,
      });
    } catch (e) {
      handlePageError(e, res, "Edit Profile");
    }
  })
  .post(async (req, res) => {
    if (!req.session.user) {
      return res.redirect("/user/login");
    }
    let user;

    try {
      user = await userData.getUserById(req.session.user.id);

      let { firstName, lastName, email, age, state, city } = req.body;

      firstName = validation.validateString(firstName, "firstName");
      lastName = validation.validateString(lastName, "lastName");
      email = validation.validateEmail(email);
      age = validation.validateNumber(Number(age), "Age", 0, 120);
      state = validation.validateState(state);
      city = validation.validateString(city, "city");

      const updatedUser = await userData.editUser(req.session.user.id, {
        firstName,
        lastName,
        email,
        age,
        state,
        city,
      });

      if (updatedUser.userUpdated) {
        return res.redirect("/user/profile?edited=true");
      }
    } catch (e) {
      const preparedStates = validation.validStates.map((state) => {
        let selected = false;

        if (user) {
          selected = state === user.state;
        }

        return {
          value: state,
          selected,
        };
      });

      return res.render("users/editProfile", {
        title: "Edit Profile",
        partial: "user_script",
        stylesheet: "users.css",
        user: user,
        states: preparedStates,
        error: e.message || e,
      });
    }
  });

router.route("/profile/delete").delete(async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/user/login");
  }

  let user;

  try {
    user = await userData.getUserById(req.session.user.id);
    const deletedUser = await userData.deleteUser(req.session.user.id);

    if (deletedUser.userDeleted) {
      req.session.destroy();
      return res.redirect("/user/login?deleted=true");
    }
  } catch (e) {
    return res.render("users/profile", {
      title: "Profile",
      partial: "user_script",
      stylesheet: "users.css",
      user: user,
      error: e.message || e,
    });
  }
});

export default router;
