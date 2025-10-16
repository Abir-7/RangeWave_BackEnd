"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable arrow-body-style */
const crypto_1 = __importDefault(require("crypto"));
const cryptoToken = () => {
    return crypto_1.default.randomBytes(32).toString("hex");
};
exports.default = cryptoToken;
