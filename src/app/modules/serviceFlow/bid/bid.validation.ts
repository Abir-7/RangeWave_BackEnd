import { z } from "zod";

export const zodBidRequestSchema = z.object({
  body: z.object({
    price: z.number().min(0), // price should be a number >= 0
    reqServiceId: z.string().length(24), // assuming MongoDB ObjectId
    placeId: z.string().nonempty(), // must be a non-empty string
    coordinates: z
      .tuple([z.number(), z.number()]) // tuple of two numbers [longitude, latitude]
      .refine(
        ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
        {
          message: "Coordinates must be valid longitude and latitude values",
        }
      ),
  }),
});
