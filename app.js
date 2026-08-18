import express from "express";
import exphbs from "express-handlebars";
import session from 'express-session';
import configRoutes from "./routes/index.js";
import configMiddleware from "./middleware.js";

const app = express();

const rewriteUnsupportedBrowserMethods = (req, res, next) => {
  if (req.body && req.body._method) {
    req.method = req.body._method;
    delete req.body._method;
  }

  next();
};

app.use(session({
  name: 'CookieName',
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: false
}));

app.use("/public", express.static("public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(rewriteUnsupportedBrowserMethods);

app.engine("handlebars", exphbs.engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

configMiddleware(app);
configRoutes(app);

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log("Your routes will be running on http://localhost:3000");
});