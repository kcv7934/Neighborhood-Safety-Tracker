
const myMiddleware = (app) => {
    app.use("/", (req, res, next) => {
        if (req.path === "/user/login" || req.path === "/user/register" || req.path.includes("/public")) {
            return next();
        }

        if (!req.session.user) {
            return res.redirect("/user/login");
        }

        next();
    });

    app.use("/user/login", (req, res, next) => {
        if (req.session.user) {
            return res.redirect("/");
        }

        next();
    });
    
    app.use("/user/register", (req, res, next) => {
        if (req.session.user) {
            return res.redirect("/");
        }

        next();
    });
};

export default myMiddleware;