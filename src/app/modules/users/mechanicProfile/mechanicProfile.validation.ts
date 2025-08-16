import { z } from "zod";

// 🔹 WorkingHour Schema
export const WorkingHourSchema = z
  .object({
    start: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
      .optional(),
    end: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
      .optional(),
  })
  .optional();

// 🔹 Certificate Schema
export const CertificateSchema = z
  .object({
    institutionName: z
      .string()
      .min(1, "Institution name is required")
      .optional(),
    startTime: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .optional(),
    endTime: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .optional(),
  })
  .optional();

// 🔹 Location Schema
export const LocationSchema = z
  .object({
    apartmentNo: z.string().min(1, "Apartment No is required").optional(),
    roadNo: z.string().min(1, "Road No is required").optional(),
    state: z.string().min(1, "State is required").optional(),
    city: z.string().min(1, "City is required").optional(),
    zipCode: z.string().min(1, "ZipCode is required").optional(),
    address: z.string().min(1, "Address is required").optional(),
    country: z.string().min(1, "Country is required").optional(),
  })
  .optional();

// 🔹 Workshop Location Schema
export const WorkshopLocationSchema = z
  .object({
    name: z.string().min(1, "Workshop name is required").optional(),
    placeId: z.string().min(1, "Place ID is required").optional(),
    coordinates: z
      .object({
        type: z.literal("Point").optional(),
        coordinates: z
          .array(z.number())
          .length(2, "Coordinates must have exactly 2 values")
          .optional(),
      })
      .optional(),
  })
  .optional();

// 🔹 Workshop Schema
export const WorkshopSchema = z
  .object({
    name: z.string().min(1, "Workshop name is required").optional(),
    workingHours: WorkingHourSchema.optional(),
    services: z.array(z.string().min(1, "Service name is required")).optional(),
    location: WorkshopLocationSchema.optional(),
  })
  .optional();

// 🔹 Mechanic Profile Schema
export const MechanicProfileUpdateSchema = z.object({
  fullName: z.string().min(1, "Full name is required").optional(),
  location: LocationSchema.optional(),
  phoneNumber: z.string().min(1, "Phone number is required").optional(),
  workshop: WorkshopSchema.optional(),
  experience: z
    .array(z.string().min(1, "Experience entry is required"))
    .optional(),
  certificates: z.array(CertificateSchema).optional(),
});
