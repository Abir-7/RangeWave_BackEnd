import { Router } from "express";
import { UserRoute } from "../modules/users/user/user.route";
import { AuthRoute } from "../modules/auth/auth.route";
import { MechanicProfileRoute } from "../modules/users/mechanicProfile/mechanicProfile.route";
import { UserProfileRoute } from "../modules/users/userProfile/userProfile.route";
import { ServiceRoute } from "../modules/serviceFlow/service/service.route";
import { BidRoute } from "../modules/serviceFlow/bid/bid.route";

import { MechanicRatingRoute } from "../modules/rating/mechanicRating/mechanicRating.route";
import { UserRatingRoute } from "../modules/rating/userRating/userRating.route";
import { StripeRoute } from "../modules/stripe/stripe.route";

const router = Router();

const apiRoutes = [
  { path: "/user", route: UserRoute },
  { path: "/user", route: MechanicProfileRoute },
  { path: "/user", route: UserProfileRoute },
  { path: "/auth", route: AuthRoute },
  { path: "/service", route: ServiceRoute },
  { path: "/bid", route: BidRoute },
  { path: "/rating", route: MechanicRatingRoute },
  { path: "/rating", route: UserRatingRoute },
  { path: "/stripe", route: StripeRoute },
];

apiRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
