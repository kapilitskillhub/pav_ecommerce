import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

import CustomerSignup from "../Customer/CustomerSignup/CustomerSignup";
import CustomerLogin from "../Customer/CustomerLogin/CustomerLogin";
import CustomerMobileVerification from "../Customer/CustomerMobileVerification/CustomerMobileVerification";
import ViewCategoriesAndDiscountedProducts from "../Customer/CustomerViewCategory/CustomerViewCategory";
import ViewSubCategoriesAndDiscountedProducts from "../Customer/CustomerViewSubCategory/CustomerViewSubCategory";
import CustomerViewProducts from "../Customer/CustomerViewProducts/CustomerViewProducts";
import CustomerViewProductDetails from "../Customer/CustomerViewProductDetails/CustomerViewProductDetails";
import CustomerLayout from "./CustomerLayout";
import CustomerViewCart from "../Customer/CustomerViewCart/CustomerViewCart";
import CustomerCheckoutPage from "../Customer/CustomerOrderCheckout/CustomerOrderCheckout";
import EditAddress from "../Customer/CustomerEditAddress/CustomerEditAddress";
import FilteredProducts from "../Customer/CustomerFilterProducts/CustomerFilterProducts";
import RazorpayPayment from "../Customer/CustomerPayment/CustomerPayment";
import ManageCustomerAddress from "../Customer/CustomerManageAddress/CustomerManageAddress";
import CustomerViewOrder from "../Customer/CustomerViewOrder/CustomerViewOrder";
import VerifyEmail from "../Customer/CustomerVerifyEmail/CustomerVerifyEmail";
import CustomerProfile from "../Customer/CustomerProfile/CustomerProfile";
import CustomerEditProfile from "../Customer/CustomerEditProfile/CustomerEditProfile";
import CustomerMyOrder from "../Customer/CustomerMyOrder/CustomerMyOrder";
import CustomerMyOrderDetails from "../Customer/CustomerMyOrderDetails/CustomerMyOrderDetails";
import AllCategories from "../Customer/CustomerAllCategories/AllCategories";
import AllProducts from "../Customer/CustomerAllCategories/Products";
import Contact from "../Customer/Contact/Contact";
import B2B from '../Customer/B2B/B2B';
import CustomerProfileOptions from "../../pages/Customer/CustomerHeader/CustomerProfileOptions";
import Policies from '../Customer/CustomerFooter/TempPolicies';
import ViewWishlist from "../Customer/CustomerWishlist/CustomerViewWishlist";
import LatestProducts from "../Customer/LatestProducts/LatestProducts";


const CLIENT_ID = "608603119335-ogp6iqcf7eq1md35247je2p5pkelji38.apps.googleusercontent.com";

const CustomerRoutes = () => {
  const [isCustomerAuthenticated, setCustomerAuthenticated] = useState(false);

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <Routes>
        <Route path="/customer-login" element={<CustomerLogin setCustomerAuthenticated={setCustomerAuthenticated} />} />
        <Route path="/customer-register" element={<CustomerSignup />} />
        <Route path="/customer-mobile-verification" element={<CustomerMobileVerification />} />
        <Route path="/verify-email/:verification_link" element={<VerifyEmail />} />

        <Route element={<CustomerLayout />}>
          <Route path="/" element={<ViewCategoriesAndDiscountedProducts />} />
          <Route path="categories/view-sub-categories/" element={<ViewSubCategoriesAndDiscountedProducts />} />
          <Route path="/categories/:categoryName/:subCategoryName" element={<CustomerViewProducts />} />
          <Route path="/product-details/:categoryName/:subCategoryName/:productId" element={<CustomerViewProductDetails />} />
          <Route path="/view-cart-products" element={<CustomerViewCart />} />
          <Route path="/checkout-page" element={<CustomerCheckoutPage />} />
          <Route path="/edit-address" element={<EditAddress />} />
          <Route path="/filtered-products" element={<FilteredProducts />} />
          <Route path="/payment" element={<RazorpayPayment />} />
          <Route path="/address" element={<ManageCustomerAddress />} />
          <Route path="/profile" element={<CustomerProfile />} />
          <Route path="/edit-profile" element={<CustomerEditProfile />} />
          <Route path="/my-orders" element={<CustomerMyOrder />} />
          <Route path="/my-orders-details" element={<CustomerMyOrderDetails />} />
          <Route path="/all-categories" element={<AllCategories />} />
          <Route path="/all-products" element={<AllProducts />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/b2b" element={<B2B />} />
          <Route path="/profile-options" element={<CustomerProfileOptions />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/wishlist" element={<ViewWishlist />} />
          <Route path="/latest-products" element={<LatestProducts/>}/>
        </Route>
      </Routes>
    </GoogleOAuthProvider>
  );
};

export default CustomerRoutes;