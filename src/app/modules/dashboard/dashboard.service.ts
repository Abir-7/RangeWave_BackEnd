/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { userRoles } from "../../interface/auth.interface";
import { Service } from "../serviceFlow/service/service.model";
import Payment from "../stripe/payment.model";
import User from "../users/user/user.model";

const dashboardData = async () => {
  const months = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const stats = await Service.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        total: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: { $arrayElemAt: [months, "$_id.month"] },
        total: 1,
      },
    },
  ]);

  const [totalMechanic, totalUser] = await Promise.all([
    User.countDocuments({
      role: userRoles.MECHANIC,
      isVerified: true,

      isBlocked: false,
    }),
    User.countDocuments({
      role: userRoles.USER,
      isVerified: true,
      isBlocked: false,
    }),
  ]);

  return {
    stats, // For Recharts monthly chart
    totalMechanic, // For overview count
    totalUser, // For overview count
  };
};
const paymentHistory = async () => {
  const history = await Payment.find()
    .populate({ path: "bidId", select: "price status extraWork location" })
    .populate({
      path: "serviceId",
      select: "description status isServiceCompleted issue schedule location",
    })
    .populate({
      path: "userProfile",
      select: "-carInfo -createdAt -updatedAt -__v",
    })
    .populate({
      path: "mechanicProfile",
      select: "-workshop -experience -certificates -createdAt -updatedAt -__v",
    })
    .select("-id -__v -createdAt -updatedAt")
    .lean();

  return history;
};

const getUsersByRole = async (role: "USER" | "MECHANIC") => {
  const roleFilter =
    role === "USER"
      ? ["USER"]
      : role === "MECHANIC"
      ? ["MECHANIC"]
      : ["USER", "MECHANIC"];

  const result = await User.aggregate([
    {
      $match: {
        role: { $in: roleFilter },
      },
    },
    {
      $lookup: {
        from: "userprofiles", // collection name (lowercase + plural)
        localField: "_id",
        foreignField: "user",
        as: "userProfile",
      },
    },
    {
      $lookup: {
        from: "mechanicprofiles", // collection name (lowercase + plural)
        localField: "_id",
        foreignField: "user",
        as: "mechanicProfile",
      },
    },
    {
      $addFields: {
        profile: {
          $cond: [
            { $eq: ["$role", "USER"] },
            { $arrayElemAt: ["$userProfile", 0] },
            { $arrayElemAt: ["$mechanicProfile", 0] },
          ],
        },
      },
    },
    {
      $project: {
        password: 0,
        userProfile: 0,
        mechanicProfile: 0,
      },
    },
  ]);

  return result;
};

export const DashboardService = {
  dashboardData,
  paymentHistory,
  getUsersByRole,
};
