"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MechanicProfileUpdateSchema = exports.WorkshopSchema = exports.WorkshopLocationSchema = exports.LocationSchema = exports.CertificateSchema = exports.WorkingHourSchema = void 0;
const zod_1 = require("zod");
// 🔹 WorkingHour Schema
exports.WorkingHourSchema = zod_1.z
    .object({
    start: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
        .optional(),
    end: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
        .optional(),
})
    .optional();
// 🔹 Certificate Schema
exports.CertificateSchema = zod_1.z
    .object({
    institutionName: zod_1.z
        .string()
        .min(1, "Institution name is required")
        .optional(),
    startTime: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .optional(),
    endTime: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .optional(),
})
    .optional();
// 🔹 Location Schema
exports.LocationSchema = zod_1.z
    .object({
    apartmentNo: zod_1.z.string().min(1, "Apartment No is required").optional(),
    roadNo: zod_1.z.string().min(1, "Road No is required").optional(),
    state: zod_1.z.string().min(1, "State is required").optional(),
    city: zod_1.z.string().min(1, "City is required").optional(),
    zipCode: zod_1.z.string().min(1, "ZipCode is required").optional(),
    address: zod_1.z.string().min(1, "Address is required").optional(),
    country: zod_1.z.string().min(1, "Country is required").optional(),
})
    .optional();
// 🔹 Workshop Location Schema
exports.WorkshopLocationSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1, "Workshop name is required").optional(),
    placeId: zod_1.z.string().min(1, "Place ID is required").optional(),
    coordinates: zod_1.z
        .object({
        type: zod_1.z.literal("Point").optional(),
        coordinates: zod_1.z
            .array(zod_1.z.number())
            .length(2, "Coordinates must have exactly 2 values")
            .optional(),
    })
        .optional(),
})
    .optional();
// 🔹 Workshop Schema
exports.WorkshopSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1, "Workshop name is required").optional(),
    workingHours: exports.WorkingHourSchema.optional(),
    services: zod_1.z.array(zod_1.z.string().min(1, "Service name is required")).optional(),
    location: exports.WorkshopLocationSchema.optional(),
})
    .optional();
// 🔹 Mechanic Profile Schema
exports.MechanicProfileUpdateSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, "Full name is required").optional(),
    location: exports.LocationSchema.optional(),
    phoneNumber: zod_1.z.string().min(1, "Phone number is required").optional(),
    workshop: exports.WorkshopSchema.optional(),
    experience: zod_1.z
        .array(zod_1.z.string().min(1, "Experience entry is required"))
        .optional(),
    certificates: zod_1.z.array(exports.CertificateSchema).optional(),
});
