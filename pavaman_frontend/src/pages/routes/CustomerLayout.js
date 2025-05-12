import { Outlet, useLocation } from "react-router-dom";
import CustomerHeader from "../Customer/CustomerHeader/CustomerHeader";
import "./CustomerLayout.css";
import CarouselLanding from "../Customer/CustomerCarousel/CustomerCarousel";
import CustomerFooter from "../Customer/CustomerFooter/CustomerFooter";


const CustomerLayout = () => {
  const location = useLocation();

  const hideHeaderAndFooter =
  location.pathname === "/customer-login" ||
  location.pathname.startsWith("/verify-email/");


  return (
    <div className="customer-layout">
      {!hideHeaderAndFooter && <CustomerHeader />}
      <Outlet />
      {!hideHeaderAndFooter && <CustomerFooter />}
    </div>

  );
};

export default CustomerLayout;