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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivecyService = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const AppError_1 = __importDefault(require("../../errors/AppError"));
const termPrivecy_interface_model_1 = require("./termPrivecy.interface.model");
const upsertPolicy = (field, value) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the single policy document
    if (!field || !value) {
        throw new AppError_1.default(404, "Field and value are required");
    }
    if (!["term", "privacy"].includes(field)) {
        throw new AppError_1.default(500, "Field must be either 'term' or 'privacy'");
    }
    let policy = yield termPrivecy_interface_model_1.Policy.findOne();
    if (!policy) {
        // If no document exists, create one with the field
        policy = new termPrivecy_interface_model_1.Policy({ [field]: value });
    }
    else {
        // Update only the field passed
        policy[field] = value;
    }
    yield policy.save();
    return policy;
});
const getPrivecy = (field) => __awaiter(void 0, void 0, void 0, function* () {
    if (field && !["term", "privacy"].includes(field)) {
        throw new AppError_1.default(500, "Field must be either 'term' or 'privery'");
    }
    const policy = yield termPrivecy_interface_model_1.Policy.findOne();
    if (!policy)
        return null;
    if (field === "term")
        return { term: policy.term };
    if (field === "privacy")
        return { privery: policy.privacy };
    return { term: policy.term, privery: policy.privacy };
});
exports.PrivecyService = {
    upsertPolicy,
    getPrivecy,
};
