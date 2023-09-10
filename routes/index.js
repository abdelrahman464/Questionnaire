const userRoute = require("./userRoute");
const authRoute = require("./authRoute");
const keyRoute = require("./keyRoute");
const answerRoute = require("./answerRoute");

const mountRoutes = (app) => {
  // Mount Routes
  app.use("/api/v1/users", userRoute);
  app.use("/api/v1/auth", authRoute);
  app.use("/api/v1/keys", keyRoute);
  app.use("/api/v1/answer", answerRoute);
};
module.exports = mountRoutes;
