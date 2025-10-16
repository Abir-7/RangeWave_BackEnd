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
exports.ExtraWorkController = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const extraWork_service_1 = require("./extraWork.service");
const reqForExtraWork = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { idData, data } = req.body;
    const result = yield extraWork_service_1.ExtraWorkService.reqForExtraWork(idData, data);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Request for extra work is send to user.",
        data: result,
    });
}));
const rejectReqForExtrawork = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pId } = req.params;
    const result = yield extraWork_service_1.ExtraWorkService.rejectReqForExtrawork(pId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Request for extra work is rejected",
        data: result,
    });
}));
const acceptReqForExtrawork = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pId } = req.params;
    const result = yield extraWork_service_1.ExtraWorkService.acceptReqForExtrawork(pId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Request for extra work is accepted.",
        data: result,
    });
}));
exports.ExtraWorkController = {
    reqForExtraWork,
    rejectReqForExtrawork,
    acceptReqForExtrawork,
};
