import { z } from "zod";

// 🔹 UserLocation schema
export const UserLocationSchema = z.object({
  apartmentNo: z
    .string()
    .refine((val) => val.trim() !== "", {
      message: "apartmentNo cannot be empty",
    })
    .optional(),
  roadNo: z
    .string()
    .refine((val) => val.trim() !== "", { message: "roadNo cannot be empty" })
    .optional(),
  state: z
    .string()
    .refine((val) => val.trim() !== "", { message: "state cannot be empty" })
    .optional(),
  city: z
    .string()
    .refine((val) => val.trim() !== "", { message: "city cannot be empty" })
    .optional(),
  zipCode: z
    .string()
    .refine((val) => val.trim() !== "", { message: "zipCode cannot be empty" })
    .optional(),
  address: z
    .string()
    .refine((val) => val.trim() !== "", { message: "address cannot be empty" })
    .optional(),
  country: z
    .string()
    .refine((val) => val.trim() !== "", { message: "country cannot be empty" })
    .optional(),
});

// 🔹 CarInfo schema
export const CarInfoSchema = z.object({
  carName: z
    .string()
    .refine((val) => val.trim() !== "", { message: "carName cannot be empty" })
    .optional(),
  carModel: z
    .string()
    .refine((val) => val.trim() !== "", { message: "carModel cannot be empty" })
    .optional(),
  vinCode: z
    .string()
    .refine((val) => val.trim() !== "", { message: "vinCode cannot be empty" })
    .optional(),
  licensePlate: z
    .string()
    .refine((val) => val.trim() !== "", {
      message: "licensePlate cannot be empty",
    })
    .optional(),
  tagNumber: z
    .string()
    .refine((val) => val.trim() !== "", {
      message: "tagNumber cannot be empty",
    })
    .optional(),
});

// 🔹 UserProfile schema
export const UserProfileUpdateSchema = z.object({
  body: z
    .object({
      fullName: z
        .string()
        .refine((val) => val.trim() !== "", {
          message: "fullName cannot be empty",
        })
        .optional(),
      nickname: z
        .string()
        .refine((val) => val.trim() !== "", {
          message: "nickname cannot be empty",
        })
        .optional(),
      dateOfBirth: z.coerce.date().optional(),
      phone: z
        .string()
        .refine((val) => val.trim() !== "", {
          message: "phone cannot be empty",
        })
        .optional(),
      location: UserLocationSchema.optional(),
      image: z.string().url().optional(),
      carInfo: CarInfoSchema.optional(),
    })
    .strict(),
});
