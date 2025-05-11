import { Router } from "express";
import { UserRoute } from "../modules/users/user/user.route";
import { AuthRoute } from "../modules/auth/auth.route";
import { MechanicProfileRoute } from "../modules/users/mechanicProfile/mechanicProfile.route";

const router = Router();
const apiRoutes = [
  { path: "/user", route: UserRoute },
  { path: "/user", route: MechanicProfileRoute },
  { path: "/auth", route: AuthRoute },
];
apiRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
