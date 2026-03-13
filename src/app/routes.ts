import { createBrowserRouter } from "react-router";
import RootLayout     from "./pages/RootLayout";
import Home           from "./pages/Home";
import Login          from "./pages/Login";
import SignupPage     from "./pages/SignupPage";
import LaundryDetails from "./pages/LaundryDetails";
import OrderPage      from "./pages/OrderPage";
import Orders         from "./pages/Orders";
import Account        from "./pages/Account";
import Notifications  from "./pages/Notifications";
import OrderDetails   from "./pages/OrderDetails";
import Services       from "./pages/Services";
import Schedule       from "./pages/Schedule";
import Billing        from "./pages/Billing";
import OrderDetailsNew from "./pages/OrderDetailsNew";
import Profile        from "./pages/Profile";
import Preferences    from "./pages/Preferences";
import OrderHistory   from "./pages/OrderHistory";
import Help           from "./pages/Help";
import RinseRepeat    from "./pages/RinseRepeat";
import RinseRepeatPlan from "./pages/RinseRepeatPlan";
import Refer          from "./pages/Refer";
import NearbyLaundries from "./pages/NearbyLaundries";
import Payment        from "./pages/Payment";
import TrackOrder     from "./pages/TrackOrder";
import RateLaundry    from "./pages/RateLaundry";

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      { path: "/",                    Component: Home },
      { path: "/login",               Component: Login },
      { path: "/signup",              Component: SignupPage },
      { path: "/nearby",              Component: NearbyLaundries },
      { path: "/refer",               Component: Refer },
      { path: "/services",            Component: Services },
      { path: "/schedule",            Component: Schedule },
      { path: "/billing",             Component: Billing },
      { path: "/profile",             Component: Profile },
      { path: "/preferences",         Component: Preferences },
      { path: "/order-history",       Component: OrderHistory },
      { path: "/help",                Component: Help },
      { path: "/rinse-repeat",        Component: RinseRepeat },
      { path: "/rinse-repeat/plan",   Component: RinseRepeatPlan },
      { path: "/laundry/:id",         Component: LaundryDetails },
      { path: "/order/:laundryId",    Component: OrderPage },
      { path: "/payment",             Component: Payment },
      { path: "/track-order/:id",     Component: TrackOrder },
      { path: "/rate-order/:id",      Component: RateLaundry },
      { path: "/orders",              Component: Orders },
      { path: "/order-details/:id",   Component: OrderDetailsNew },
      { path: "/account",             Component: Account },
      { path: "/notifications",       Component: Notifications },
    ],
  },
]);
