"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_route_1 = require("../modules/users/user/user.route");
const auth_route_1 = require("../modules/auth/auth.route");
const mechanicProfile_route_1 = require("../modules/users/mechanicProfile/mechanicProfile.route");
const userProfile_route_1 = require("../modules/users/userProfile/userProfile.route");
const service_route_1 = require("../modules/serviceFlow/service/service.route");
const bid_route_1 = require("../modules/serviceFlow/bid/bid.route");
const mechanicRating_route_1 = require("../modules/rating/mechanicRating/mechanicRating.route");
const userRating_route_1 = require("../modules/rating/userRating/userRating.route");
const stripe_route_1 = require("../modules/stripe/stripe.route");
const room_route_1 = require("../modules/chat/room/room.route");
const message_route_1 = require("../modules/chat/message/message.route");
const dashboard_route_1 = require("../modules/dashboard/dashboard.route");
const termPrivecy_route_1 = require("../modules/terms&privecy/termPrivecy.route");
const router = (0, express_1.Router)();
const apiRoutes = [
    { path: "/user", route: user_route_1.UserRoute },
    { path: "/user", route: mechanicProfile_route_1.MechanicProfileRoute },
    { path: "/user", route: userProfile_route_1.UserProfileRoute },
    { path: "/auth", route: auth_route_1.AuthRoute },
    { path: "/service", route: service_route_1.ServiceRoute },
    { path: "/bid", route: bid_route_1.BidRoute },
    { path: "/rating", route: mechanicRating_route_1.MechanicRatingRoute },
    { path: "/rating", route: userRating_route_1.UserRatingRoute },
    { path: "/stripe", route: stripe_route_1.StripeRoute },
    { path: "/chat", route: room_route_1.ChatRoute },
    { path: "/chat", route: message_route_1.MessageRoute },
    { path: "/dashboard", route: dashboard_route_1.DashboardRoute },
    { path: "/privecy&term", route: termPrivecy_route_1.PrivecyRoute },
];
apiRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
