const userRoute = require("./userRoute");
const authRoute = require("./authRoute");
const keyRoute = require("./keyRoute");
const answerRoute = require("./answerRoute");
const questionRoute = require("./questionRoute");
const organizationRoute = require("./organizationRoute");
const webSiteInfoRoute = require("./webSiteInfoRoute");

const mountRoutes = (app) => {
  // Mount Routes
  app.use("/api/v1/users", userRoute);
  app.use("/api/v1/auth", authRoute);
  app.use("/api/v1/keys", keyRoute);
  app.use("/api/v1/answer", answerRoute);
  app.use("/api/v1/questions", questionRoute);
  app.use("/api/v1/organizations", organizationRoute);
  app.use("/api/v1/webSiteInfo", webSiteInfoRoute);
};
module.exports = mountRoutes;
