"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileUpdateSchema = exports.CarInfoSchema = exports.UserLocationSchema = void 0;
const zod_1 = require("zod");
// 🔹 UserLocation schema
exports.UserLocationSchema = zod_1.z.object({
    apartmentNo: zod_1.z
        .string()
        .refine((val) => val.trim() !== "", {
        message: "apartmentNo cannot be empty",
    })
        .optional(),
    roadNo: zod_1.z
        .string()
        .refine((val) => val.trim() !== "", { message: "roadNo cannot be empty" })
        .optional(),
    state: zod_1.z
        .string()
        .refine((val) => val.trim() !== "", { message: "state cannot be empty" })
        .optional(),
    city: zod_1.z
        .string()
        .refine((val) => val.trim() !== "", { message: "city cannot be empty" })
        .optional(),
    zipCode: zod_1.z
        .string()
        .refine((val) => val.trim() !== "", { message: "zipCode cannot be empty" })
        .optional(),
    address: zod_1.z
        .string()
        .refine((val) => val.trim() !== "", { message: "address cannot be empty" })
        .optional(),
    country: zod_1.z
        .string()
        .refine((val) => val.trim() !== "", { message: "country cannot be empty" })
        .optional(),
});
// 🔹 CarInfo schema
exports.CarInfoSchema = zod_1.z.object({
    carName: zod_1.z
        .string()
        .refine((val) => val.trim() !== "", { message: "carName cannot be empty" })
        .optional(),
    carModel: zod_1.z
        .string()
        .refine((val) => val.trim() !== "", { message: "carModel cannot be empty" })
        .optional(),
    vinCode: zod_1.z
        .string()
        .refine((val) => val.trim() !== "", { message: "vinCode cannot be empty" })
        .optional(),
    licensePlate: zod_1.z
        .string()
        .refine((val) => val.trim() !== "", {
        message: "licensePlate cannot be empty",
    })
        .optional(),
    tagNumber: zod_1.z
        .string()
        .refine((val) => val.trim() !== "", {
        message: "tagNumber cannot be empty",
    })
        .optional(),
});
// 🔹 UserProfile schema
exports.UserProfileUpdateSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        fullName: zod_1.z
            .string()
            .refine((val) => val.trim() !== "", {
            message: "fullName cannot be empty",
        })
            .optional(),
        nickname: zod_1.z
            .string()
            .refine((val) => val.trim() !== "", {
            message: "nickname cannot be empty",
        })
            .optional(),
        dateOfBirth: zod_1.z.coerce.date().optional(),
        phone: zod_1.z
            .string()
            .refine((val) => val.trim() !== "", {
            message: "phone cannot be empty",
        })
            .optional(),
        location: exports.UserLocationSchema.optional(),
        image: zod_1.z.string().url().optional(),
        carInfo: exports.CarInfoSchema.optional(),
    })
        .strict(),
});
