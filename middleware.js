
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
};

export default myMiddleware;