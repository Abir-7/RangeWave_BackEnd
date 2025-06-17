import { z } from "zod";

// 🔹 WorkingHour Schema
export const WorkingHourSchema = z
  .object({
    start: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .refine((val) => val.trim() !== "", {
        message: "Start time cannot be empty",
      })
      .optional(),
    end: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .refine((val) => val.trim() !== "", {
        message: "End time cannot be empty",
      })
      .optional(),
  })
  .optional();

// 🔹 Certificate Schema
export const CertificateSchema = z
  .object({
    institutionName: z
      .string()
      .refine((val) => val.trim() !== "", {
        message: "Institution name cannot be empty",
      })
      .optional(),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .refine((val) => val.trim() !== "", {
        message: "Start time cannot be empty",
      })
      .optional(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .refine((val) => val.trim() !== "", {
        message: "End time cannot be empty",
      })
      .optional(),
  })
  .optional();

// 🔹 Location Schema
export const LocationSchema = z
  .object({
    apartmentNo: z
      .string()
      .refine((val) => val.trim() !== "", { message: "Apartment No required" })
      .optional(),
    roadNo: z
      .string()
      .refine((val) => val.trim() !== "", { message: "Road No required" })
      .optional(),
    state: z
      .string()
      .refine((val) => val.trim() !== "", { message: "State required" })
      .optional(),
    city: z
      .string()
      .refine((val) => val.trim() !== "", { message: "City required" })
      .optional(),
    zipCode: z
      .string()
      .refine((val) => val.trim() !== "", { message: "ZipCode required" })
      .optional(),
    address: z
      .string()
      .refine((val) => val.trim() !== "", { message: "Address required" })
      .optional(),
    country: z
      .string()
      .refine((val) => val.trim() !== "", { message: "Country required" })
      .optional(),
  })
  .optional();

// 🔹 Workshop Location Schema
export const WorkshopLocationSchema = z
  .object({
    name: z
      .string()
      .refine((val) => val.trim() !== "", { message: "Workshop name required" })
      .optional(),
    placeId: z
      .string()
      .refine((val) => val.trim() !== "", { message: "Place ID required" })
      .optional(),
    coordinates: z
      .object({
        type: z.literal("Point").optional(),
        coordinates: z.array(z.number()).length(2).optional(),
      })
      .optional(),
  })
  .optional();

// 🔹 Workshop Schema
export const WorkshopSchema = z
  .object({
    name: z
      .string()
      .refine((val) => val.trim() !== "", { message: "Workshop name required" })
      .optional(),
    workingHours: WorkingHourSchema.optional(),
    services: z.array(z.string().min(1, "Service cannot be empty")).optional(),
    location: WorkshopLocationSchema.optional(),
  })
  .optional();

// 🔹 Mechanic Profile Schema
export const MechanicProfileUpdateSchema = z.object({
  body: z
    .object({
      fullName: z
        .string()
        .refine((val) => val.trim() !== "", {
          message: "Full name cannot be empty",
        })
        .optional(),
      location: LocationSchema.optional(),
      phoneNumber: z
        .string()
        .refine((val) => val.trim() !== "", {
          message: "Phone number required",
        })
        .optional(),
      workshop: WorkshopSchema.optional(),
      experience: z
        .array(z.string().min(1, "Experience entry cannot be empty"))
        .optional(),
      certificates: z.array(CertificateSchema).optional(),
    })
    .strict(),
});
