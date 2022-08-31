"use strict";

const Hapi = require("@hapi/hapi");
const { Pool, Client } = require("pg");
const Inert = require("@hapi/inert");
const Vision = require("@hapi/vision");
const HapiSwagger = require("hapi-swagger");
const Pack = require("./package");
const { DateTime } = require("luxon");
const Joi = require("joi");
require("dotenv").config();

const init = async () => {
  const client = new Pool({
    connectionString: process.env.POSTGRES_CONN,
  });

  const server = Hapi.server({
    port: process.env.PORT,
    host: "0.0.0.0",
    state: {
      ignoreErrors: true,
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
      cors: {
        origin: ["*"],
      },
    },
    handler: async (request, h) => {
      return "Hello World!";
    },
  });

  server.route({
    method: "GET",
    path: "/inspection/{id}/carGpsTrack",
    options: {
      tags: ["api"],
      cors: {
        origin: ["*"],
      },
      validate: {
        params: Joi.object({
          id: Joi.number().required(),
          // .description('the id for the todo item'),
        }),
      },
    },
    handler: async (request, h) => {
      const inspectionId = request.params.id;
      const result = await client.query(
        'SELECT * FROM "carGpsTrack" WHERE inspectionId = $1 ORDER BY createdAt DESC',
        [inspectionId]
      );
      return result.rows || {};
    },
  });

  server.route({
    method: "POST",
    path: "/inspection/{id}/carGpsTrack",
    options: {
      tags: ["api"],
      cors: {
        origin: ["*"],
      },
      validate: {
        params: Joi.object({
          id: Joi.number().required(),
          // .description('the id for the todo item'),
        }),
        payload: Joi.object({
          createdAt: Joi.date(),
          lat: Joi.number().default("0"),
          long: Joi.number().default("0"),
        }),
      },
    },
    handler: async (request, h) => {
      const inspectionId = request.params.id;
      const { createdAt, lat, long } = request.payload;
      // const createdAtJSDate = DateTime.fromJSDate(createdAt).toJSDate();
      const result = await client.query(
        'INSERT INTO "carGpsTrack" (createdAt, lat, long, inspectionId) VALUES($1, $2, $3, $4)',
        [createdAt, lat, long, inspectionId]
      );

      return {
        code: 200,
        result: {
          id: result.rows[0],
        },
      };
    },
  });

  await server.start();

  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
