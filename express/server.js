const serverless = require("serverless-http");
const proxy = require('express-http-proxy');

// const addRequestId = require('express-request-id')();

var cors = require("cors");

require("dotenv").config();

const options = {
  target: process.env.TARGET || "",
  port: process.env.PORT || 80,
  token: process.env.TOKEN || "",
};

console.log("Start proxy on port", options.port, "for", options.target);
const express = require("express");
// const { createProxyMiddleware } = require("http-proxy-middleware");


const app = express();
const router = express.Router();
// router.use(express.json());
router.use(express.urlencoded({ extended: true }));
// app.use(addRequestId);
// router.use(addRequestId);



router.use(
  cors({
    allowedHeaders: ['Accept-Version', 'Authorization', 'Credentials', 'Content-Type',"x-request-id"],
    exposedHeaders: ['X-Request-Id',"x-request-id"],
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
  })
);

router.use('/newsletter', proxy(options.target, {
  filter: function (req, res) {
    const path = req.originalUrl;
    console.log('path', { path, req, method: req.method });
    // return true;
    return path.includes('/newsletter') && (req.method === 'POST');
  },
  proxyReqPathResolver: function (req) {
    const path = req.url
    console.log(req.path, req.url);
    return "/v1/tickets";
    // return path.replace("/newsletter", "");

  },

  proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
    if (options.token) {
      proxyReqOpts.headers["Authorization"] = `${options.token}`;
      proxyReqOpts.headers["x-request-id"] = new Date().getTime();
      delete proxyReqOpts.headers["origin"];
    }
    console.log({ proxyReqOpts });
    return proxyReqOpts;
  }

}));

router.use('/*', (req, res) => {
  return res.status(404).send('Not Found');
})

app.use("/.netlify/functions/server", router);

module.exports = app;
module.exports.handler = serverless(app);
