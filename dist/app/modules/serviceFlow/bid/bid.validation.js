"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zodBidRequestSchema = void 0;
const zod_1 = require("zod");
exports.zodBidRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        price: zod_1.z.number().min(0), // price should be a number >= 0
        reqServiceId: zod_1.z.string().length(24), // assuming MongoDB ObjectId
        placeId: zod_1.z.string().nonempty(), // must be a non-empty string
        coordinates: zod_1.z
            .tuple([zod_1.z.number(), zod_1.z.number()]) // tuple of two numbers [longitude, latitude]
            .refine(([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90, {
            message: "Coordinates must be valid longitude and latitude values",
        }),
    }),
});
