import { createTRPCRouter } from "./init";
import { adminRouter } from "./routers/admin";
import { advisorRouter } from "./routers/advisor";
import { analyticsRouter } from "./routers/analytics";
import { authRouter } from "./routers/auth";
import { badgeRouter } from "./routers/badge";
import { communityRouter } from "./routers/community";
import { communityNotificationsRouter } from "./routers/communityNotifications";
import { leadRouter } from "./routers/lead";
import { orderRouter } from "./routers/order";
import { productRouter } from "./routers/product";
import { reviewRouter } from "./routers/review";
import { storefrontRouter } from "./routers/storefront";
import { studentsRouter } from "./routers/students";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  storefront: storefrontRouter,
  product: productRouter,
  order: orderRouter,
  lead: leadRouter,
  review: reviewRouter,
  badge: badgeRouter,
  community: communityRouter,
  studentNetwork: studentsRouter,
  communityNotifications: communityNotificationsRouter,
  analytics: analyticsRouter,
  advisor: advisorRouter,
  admin: adminRouter
});

export type AppRouter = typeof appRouter;
