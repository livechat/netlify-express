const serverless = require("serverless-http");
var cors = require("cors");

require("dotenv").config();

const options = {
  target: process.env.TARGET || "",
  port: process.env.PORT || 80,
  token: process.env.TOKEN || "",
};

console.log("Start proxy on port", options.port, "for", options.target);
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const router = express.Router();
router.use(
  cors({
    allowedHeaders: ["Content-Type"],
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
  })
);

router.use(
  "/newsletter",
  createProxyMiddleware({
    target: options.target,
    changeOrigin: true,
    secure: false,
    pathRewrite: function (path, req) {
      return path.replace("/.netlify/functions/express/newsletter", "");
    },
    onProxyReq: function onProxyReq(proxyReq, req, res) {
      if (options.token) {
        proxyReq.setHeader("Authorization", `${options.token}`);
        proxyReq.removeHeader("origin");
      }
    },
  })
);

app.use("/.netlify/functions/express", router);

module.exports = app;
module.exports.handler = serverless(app);
