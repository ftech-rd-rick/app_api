"use strict";

const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const Vision = require("@hapi/vision");
const HapiSwagger = require("hapi-swagger");
const Joi = require("joi");
const { DateTime } = require("luxon");

const Pack = require("./package");
require("dotenv").config();

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: "0.0.0.0",
    state: {
      ignoreErrors: true,
    },
    routes: {
      cors: true,
    },
  });

  await server.register({
    plugin: require("hapi-pino"),
    options: {
      logRequestComplete: false,
      redact: ["req.headers.authorization"],
    },
  });

  const swaggerOptions = {
    info: {
      title: "Test API Documentation",
      version: Pack.version,
    },
  };

  await server.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: swaggerOptions,
    },
  ]);

  server.route({
    method: "GET",
    path: "/",
    options: {
      tags: ["api"],
    },
    handler: async (request, h) => {
      return "Hello World!";
    },
  });

  await server.register(require("./router/carGpsTracks"));
  await server.register(require("./router/inspections"));

  await server.start();

  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
