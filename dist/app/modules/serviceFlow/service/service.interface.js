"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelReason = exports.IsServiceCompleted = exports.Status = void 0;
var Status;
(function (Status) {
    Status["FINDING"] = "FINDING";
    Status["WAITING"] = "WAITING";
    Status["WORKING"] = "WORKING";
    Status["COMPLETED"] = "COMPLETED";
    Status["CANCELLED"] = "CANCELLED";
})(Status || (exports.Status = Status = {}));
var IsServiceCompleted;
(function (IsServiceCompleted) {
    IsServiceCompleted["YES"] = "YES";
    IsServiceCompleted["NO"] = "NO";
    IsServiceCompleted["WAITING"] = "WAITING";
    IsServiceCompleted["REJECTED"] = "REJECTED";
})(IsServiceCompleted || (exports.IsServiceCompleted = IsServiceCompleted = {}));
var CancelReason;
(function (CancelReason) {
    CancelReason["WAIT_TIME_TOO_LONG"] = "Wait time is too long";
    CancelReason["COULD_NOT_FIND_MECHANIC"] = "Could not find mechanic";
    CancelReason["MECHANIC_NOT_GETTING_CLOSER"] = "Mechanic not getting closer";
    CancelReason["MECHANIC_ASKED_ME_TO_CANCEL"] = "Mechanic asked me to cancel";
    CancelReason["OTHER"] = "Other";
})(CancelReason || (exports.CancelReason = CancelReason = {}));
// For ExtraWorkModel
