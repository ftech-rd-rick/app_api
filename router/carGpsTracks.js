const Joi = require("joi");
const { Pool } = require("pg");

exports.plugin = {
  //pkg: require('./package.json'),
  name: "carGpsTrack",
  version: "1.0.0",
  register: async function (server, options) {
    const client = new Pool({
      connectionString: process.env.POSTGRES_CONN,
    });

    server.route({
      method: "GET",
      path: "/inspections/{id}/carGpsTracks",
      options: {
        tags: ["api"],
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
          'SELECT * FROM "carGpsTrack" WHERE "inspectionId" = $1 ORDER BY "createdAt" DESC',
          [inspectionId]
        );
        return {
          code: 200,
          result: result.rows || [],
        };
      },
    });

    server.route({
      method: "POST",
      path: "/inspections/{id}/carGpsTracks",
      options: {
        tags: ["api"],
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
          'INSERT INTO "carGpsTrack" ("createdAt", "lat", "long", "inspectionId") VALUES($1, $2, $3, $4) RETURNING id',
          [createdAt, lat, long, inspectionId]
        );

        return {
          code: 200,
          result: {
            id: result.rows.length == 0 ? {} : result.rows[0],
          },
        };
      },
    });
  },
};
