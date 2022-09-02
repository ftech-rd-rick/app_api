const Joi = require("joi");
const { Pool } = require("pg");

exports.plugin = {
  //pkg: require('./package.json'),
  name: "inspection",
  version: "1.0.0",
  register: async function (server, options) {
    const client = new Pool({
      connectionString: process.env.POSTGRES_CONN,
    });

    server.route({
      method: "POST",
      path: "/inspections",
      options: {
        tags: ["api"],
        cors: { origin: ["*"], credentials: true },
        validate: {
          payload: Joi.object({
            driverId: Joi.number().default("0"),
            carId: Joi.number().default("0"),
            pathId: Joi.number().default("0"),
            modeId: Joi.number().default("0"),
          }),
        },
      },
      handler: async (request, h) => {
        const { driverId, carId, pathId, modeId } = request.payload;

        const result = await client.query(
          'INSERT INTO "inspection" (createdAt, driverId, carId, pathId, modeId) VALUES($1, $2, $3, $4, $5)',
          [new Date(), driverId, carId, pathId, modeId]
        );

        return {
          code: 200,
          result: result.rows.length == 0 ? {} : result.rows[0],
        };
      },
    });

    server.route({
      method: "GET",
      path: "/inspections/{id}",
      options: {
        tags: ["api"],
        cors: { origin: ["*"], credentials: true },
        validate: {
          params: Joi.object({
            id: Joi.number().required(),
            // .description('the id for the todo item'),
          }),
        },
      },
      handler: async (request, h) => {
        const id = request.params.id;
        const result = await client.query(
          'SELECT * FROM "inspection" WHERE id = $1 AND isDeleted != true',
          [id]
        );

        return {
          code: result.rows.length == 0 ? 404 : 200,
          result: result.rows.length == 0 ? {} : result.rows[0],
        };
      },
    });

    server.route({
      method: "GET",
      path: "/inspections",
      options: {
        tags: ["api"],
        cors: { origin: ["*"], credentials: true },
      },
      handler: async (request, h) => {
        const result = await client.query(
          'SELECT * FROM "inspection" WHERE isDeleted != tru'
        );

        return {
          code: 200,
          result: result.rows || [],
        };
      },
    });

    // server.route({
    //   method: "PUT",
    //   path: "/inspections",
    //   options: {
    //     tags: ["api"],
    //     cors: { origin: ["*"], credentials: true },
    //   },
    //   handler: async (request, h) => {
    //     const inspectionId = request.params.id;
    //     const result = await client.query(
    //       'UPDATE "inspection" SET inspectionId = $1 AND ORDER BY createdAt DESC',
    //       [inspectionId]
    //     );
    //     return result.rows || {};
    //   },
    // });

    server.route({
      method: "DELETE",
      path: "/inspections/{id}",
      options: {
        tags: ["api"],
        cors: { origin: ["*"], credentials: true },
        validate: {
          params: Joi.object({
            id: Joi.number().required(),
            // .description('the id for the todo item'),
          }),
        },
      },
      handler: async (request, h) => {
        const id = request.params.id;
        const result = await client.query(
          'UPDATE "inspection" SET isDeleted = true WHERE id = $1',
          [id]
        );
        return {
          code: 200,
          result: result.rows.length == 0 ? {} : result.rows[0],
        };
      },
    });
  },
};
