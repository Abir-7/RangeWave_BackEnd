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
exports.ServiceController = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const service_service_1 = require("./service.service");
//--------------------------------- For Users -----------------------------------------//
const addServiceReq = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const serviceData = req.body;
    const result = yield service_service_1.ServiceService.addServiceReq(serviceData, req.user.userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 201,
        message: "Service created successfully",
        data: result,
    });
}));
const checkServiceStatusFinding = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_service_1.ServiceService.checkServiceStatusFinding(req.user.userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Service with status finding fetched successfully",
        data: result,
    });
}));
const getBidListOfService = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sId } = req.params;
    const result = yield service_service_1.ServiceService.getBidListOfService(sId, req.user.userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Bid list of a Service retrieved successfully",
        data: result,
    });
}));
const hireMechanic = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_service_1.ServiceService.hireMechanic(req.body, req.user.userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Payment intent created successfully",
        data: result,
    });
}));
const markServiceAsComplete = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pId } = req.params;
    const result = yield service_service_1.ServiceService.markServiceAsComplete(pId, req.body.paymentType);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Mark as completed.",
        data: result,
    });
}));
const mechanicDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { mechanicId } = req.params;
    const result = yield service_service_1.ServiceService.mechanicDetails(mechanicId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Mechanic details fetched.",
        data: result,
    });
}));
const getMechanicRatings = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { mechanicId } = req.params;
    const result = yield service_service_1.ServiceService.getMechanicRatings(mechanicId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Mechanic rating details fetched.",
        data: result,
    });
}));
//---------------------------- For Both Mechanics and Users-----------------------------//
const getRunningService = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_service_1.ServiceService.getRunningService(req.user.userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Current Service data is fetched successfully",
        data: result,
    });
}));
const seeCurrentServiceProgress = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_service_1.ServiceService.seeCurrentServiceProgress(req.params.pId, req.user.userRole);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Current Service progress data is fetched successfully",
        data: result,
    });
}));
const cancelService = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pId } = req.params;
    const serviceData = req.body;
    const result = yield service_service_1.ServiceService.cancelService(pId, serviceData, req.user.userId, req.user.userRole);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Service updated successfully",
        data: result,
    });
}));
//--------------------------------- For Mechanics -----------------------------------------//
const getUserRatings = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const result = yield service_service_1.ServiceService.getUserRatings(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "User rating details fetched.",
        data: result,
    });
}));
const getAllRequestedService = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_service_1.ServiceService.getAllRequestedService(req.user.userId, req.body.coordinate);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Service req list is fetched successfully",
        data: result,
    });
}));
const seeServiceDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sId } = req.params;
    const result = yield service_service_1.ServiceService.seeServiceDetails(sId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Service details is fetched successfully",
        data: result,
    });
}));
const changeServiceStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pId } = req.params;
    const result = yield service_service_1.ServiceService.changeServiceStatus(pId, req.body.status, req.body.extraWork);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Service status is changed successfully",
        data: result,
    });
}));
//for socket
const pushNewServiceReq = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield service_service_1.ServiceService.pushNewServiceReq(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "new service request is fetched.",
        data: result,
    });
}));
const addNewBidDataToService = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sId, bId } = req.params;
    const result = yield service_service_1.ServiceService.addNewBidDataToService(sId, req.user.userId, bId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "new bid data is fetch for the service",
        data: result,
    });
}));
exports.ServiceController = {
    addServiceReq,
    checkServiceStatusFinding,
    getBidListOfService,
    hireMechanic,
    getMechanicRatings,
    cancelService,
    seeServiceDetails,
    getRunningService,
    seeCurrentServiceProgress,
    getAllRequestedService,
    pushNewServiceReq,
    getUserRatings,
    addNewBidDataToService,
    changeServiceStatus,
    markServiceAsComplete,
    mechanicDetails,
};
