import { userRoles } from "../../interface/auth.interface";
import { Service } from "../serviceFlow/service/service.model";
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

export const DashboardService = {
  dashboardData,
};
