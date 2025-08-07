/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { userRoles } from "../../interface/auth.interface";
import { Service } from "../serviceFlow/service/service.model";
import Payment from "../stripe/payment.model";
import User from "../users/user/user.model";

const dashboardData = async () => {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear + 1, 0, 1);

  const dayStats = await Service.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfYear,
          $lt: endOfYear,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        totalService: { $sum: 1 },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1,
      },
    },
  ]);

  type DailyVisit = {
    day: number;
    totalService: number;
    date: string;
  };

  type MonthlyData = Record<string, DailyVisit[]>;

  const months = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthlyData: MonthlyData = {};

  for (const {
    _id: { year, month, day },
    totalService,
  } of dayStats) {
    const monthName = months[month];
    const monthKey = `${monthName} ${year}`;
    const date = `${monthName} ${day}, ${year}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = [];
    }

    monthlyData[monthKey].push({ day, totalService, date });
  }

  // Fill missing days with totalService = 0
  for (const monthKey in monthlyData) {
    const [monthName, yearStr] = monthKey.split(" ");
    const year = Number(yearStr);
    const monthIndex = months.indexOf(monthName);

    // Get number of days in the month
    const daysInMonth = new Date(year, monthIndex, 0).getDate();

    // Map existing days for quick lookup
    const dayMap = new Map(monthlyData[monthKey].map((d) => [d.day, d]));

    const fullDays: DailyVisit[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      if (dayMap.has(d)) {
        fullDays.push(dayMap.get(d)!);
      } else {
        fullDays.push({
          day: d,
          totalService: 0,
          date: `${monthName} ${d}, ${year}`,
        });
      }
    }

    monthlyData[monthKey] = fullDays;
  }

  const [totalMechanic, totalUser] = await Promise.all([
    User.countDocuments({
      role: userRoles.MECHANIC,
      isVerified: true,
      isDeleted: false,
      isBlocked: false,
    }),
    User.countDocuments({
      role: userRoles.USER,
      isVerified: true,
      isDeleted: false,
      isBlocked: false,
    }),
  ]);

  return {
    monthlyData,
    totalMechanic,
    totalUser,
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

const getUsersByRole = async (
  role: "USER" | "MECHANIC",
  searchTerm?: string
) => {
  const roleFilter =
    role === "USER"
      ? ["USER"]
      : role === "MECHANIC"
      ? ["MECHANIC"]
      : ["USER", "MECHANIC"];

  const matchStage: any = {
    role: { $in: roleFilter },
    isBlocked: false,
    isDeleted: false,
    isVerified: true,
  };

  if (searchTerm) {
    matchStage.$or = [
      { email: { $regex: searchTerm, $options: "i" } }, // match email
    ];
  }

  const result = await User.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "userprofiles",
        localField: "_id",
        foreignField: "user",
        as: "userProfile",
      },
    },
    {
      $lookup: {
        from: "mechanicprofiles",
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
    // Optional: Filter by profile.name (after join)
    ...(searchTerm
      ? [
          {
            $match: {
              $or: [
                { email: { $regex: searchTerm, $options: "i" } },
                { "profile.fullName": { $regex: searchTerm, $options: "i" } },
              ],
            },
          },
        ]
      : []),
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
