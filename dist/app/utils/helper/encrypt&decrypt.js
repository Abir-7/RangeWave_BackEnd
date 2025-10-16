"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
// utils/encryptor.ts
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../../config");
const algorithm = "aes-256-cbc";
const secretKey = crypto_1.default
    .createHash("sha256")
    .update(config_1.appConfig.encrypt.s_key) // 🔐 use env var in production
    .digest("base64")
    .substr(0, 32); // 32 bytes for aes-256
// Encrypt function that returns a single string (iv:encryptedData)
const encrypt = (text) => {
    const iv = crypto_1.default.randomBytes(16); // 16-byte IV
    const cipher = crypto_1.default.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(text, "utf-8", "hex");
    encrypted += cipher.final("hex");
    // Combine iv and encrypted data using ':'
    return `${iv.toString("hex")}:${encrypted}`;
};
exports.encrypt = encrypt;
// Decrypt function that accepts a single string (iv:encryptedData)
const decrypt = (combined) => {
    const [ivHex, encryptedData] = combined.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto_1.default.createDecipheriv(algorithm, secretKey, iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};
exports.decrypt = decrypt;
