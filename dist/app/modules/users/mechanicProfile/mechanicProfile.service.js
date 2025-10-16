"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWorkshopLocation = exports.MechanicProfileService = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable arrow-body-style */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const mechanicProfile_model_1 = require("./mechanicProfile.model");
const removeFalsyField_1 = require("../../../utils/helper/removeFalsyField");
const user_model_1 = __importDefault(require("../user/user.model"));
const mongoose_1 = require("mongoose");
const updateMechanicProfile = (email, data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const session = yield (0, mongoose_1.startSession)();
    session.startTransaction();
    try {
        const mechanicProfile = yield mechanicProfile_model_1.MechanicProfile.findOne({ email }).session(session);
        if (!mechanicProfile) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Mechanic profile not found");
        }
        const { location: userLocation, certificates, experience, phoneNumber, workshop, fullName, } = data;
        // --- Update top-level location ---
        if (userLocation && Object.keys(userLocation).length > 0) {
            const locations = (0, removeFalsyField_1.removeFalsyFields)(userLocation);
            for (const field in locations) {
                mechanicProfile.location[field] = locations[field];
            }
        }
        // --- Update workshop data ---
        if (workshop) {
            const { location, name, services, workingHours } = workshop;
            mechanicProfile.workshop = mechanicProfile.workshop || {};
            // --- Workshop location ---
            if (location && Object.keys(location).length > 0) {
                const { coordinates } = location, other = __rest(location, ["coordinates"]);
                mechanicProfile.workshop.location =
                    mechanicProfile.workshop.location || {};
                const locFields = (0, removeFalsyField_1.removeFalsyFields)(other);
                for (const field in locFields) {
                    mechanicProfile.workshop.location[field] = locFields[field];
                }
                // Validate coordinates before saving
                if (((_a = coordinates === null || coordinates === void 0 ? void 0 : coordinates.coordinates) === null || _a === void 0 ? void 0 : _a.length) === 2) {
                    const [lng, lat] = coordinates.coordinates;
                    if (typeof lng === "number" &&
                        typeof lat === "number" &&
                        lng >= -180 &&
                        lng <= 180 &&
                        lat >= -90 &&
                        lat <= 90) {
                        mechanicProfile.workshop.location.coordinates = {
                            type: "Point",
                            coordinates: [lng, lat],
                        };
                        const isWorkshopPresent = yield (0, exports.checkWorkshopLocation)([lng, lat], 100, email);
                        if (isWorkshopPresent) {
                            mechanicProfile.isNeedToPayForWorkShop = true;
                        }
                    }
                    else {
                        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid coordinates provided");
                    }
                }
            }
            // --- Workshop services ---
            if (services) {
                mechanicProfile.workshop.services = services; // allow empty array to clear
            }
            // --- Workshop name ---
            if (name) {
                mechanicProfile.workshop.name = name;
            }
            // --- Workshop working hours ---
            if (workingHours && Object.keys(workingHours).length > 0) {
                mechanicProfile.workshop.workingHours =
                    mechanicProfile.workshop.workingHours || {};
                const newData = (0, removeFalsyField_1.removeFalsyFields)(workingHours);
                for (const field in newData) {
                    mechanicProfile.workshop.workingHours[field] =
                        newData[field];
                }
            }
        }
        // --- Certificates ---
        if (certificates) {
            mechanicProfile.certificates = certificates; // allow empty array
        }
        // --- Experience ---
        if (experience) {
            mechanicProfile.experience = experience; // allow empty array
        }
        // --- Phone number ---
        if (phoneNumber) {
            mechanicProfile.phoneNumber = phoneNumber;
        }
        // --- Full name ---
        if (fullName) {
            mechanicProfile.fullName = fullName;
        }
        // --- Update User doc to mark profile updated ---
        yield user_model_1.default.findByIdAndUpdate(mechanicProfile.user, { needToUpdateProfile: false }, { new: true, session });
        yield mechanicProfile.save({ session });
        yield session.commitTransaction();
        return mechanicProfile;
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
exports.MechanicProfileService = { updateMechanicProfile };
// helper-----------------------------
const checkWorkshopLocation = (coordinates, // [longitude, latitude]
maxDistanceMeters, currentUserEmail // user who is updating
) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        "workshop.location.coordinates": {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates,
                },
                $maxDistance: maxDistanceMeters,
            },
        },
    };
    // Exclude workshops of the current user
    if (currentUserEmail) {
        query.email = { $ne: currentUserEmail };
    }
    const existingWorkshop = yield mechanicProfile_model_1.MechanicProfile.findOne(query);
    if (existingWorkshop) {
        return true;
    }
    return false;
});
exports.checkWorkshopLocation = checkWorkshopLocation;
