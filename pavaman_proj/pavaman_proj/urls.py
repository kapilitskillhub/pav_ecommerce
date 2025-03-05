"""
URL configuration for pavaman_proj project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from pavaman_backend.views import (add_admin,admin_login,admin_logout,
    add_category,view_categories,edit_category,delete_category,
    add_subcategory,view_subcategories,edit_subcategory,delete_subcategory,
    add_product,add_product_specifications,edit_product_specifications,view_products,
    view_product_details,edit_product,delete_product,
    search_categories,search_subcategories,search_products
    )

    #admin_logout,
    #add_category,view_categories,#edit_category,delete_category,
    # add_subcategory,view_subcategories,edit_subcategory,delete_subcategory,
    # add_product,view_products,view_product_details,add_product_specifications,edit_product,edit_product_specifications,delete_product

#    )
from pavaman_backend.customer_views import (customer_register,customer_login,view_categories_and_discounted_products,
    view_sub_categories_and_discounted_products,view_products_by_category_and_subcategory,
    view_product_details,add_product_to_cart,view_product_cart,delete_product_cart,delete_selected_products_cart,add_customer_address,
    view_customer_address,edit_customer_address,verify_email,google_login,
    google_submit_mobile,otp_generate,verify_otp,set_new_password)
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('add-admin',add_admin,name='add_admin'),
    path('admin-login',admin_login,name='admin_login'),
    path('admin-logout',admin_logout,name='admin_logout'),
    path('add-category', add_category, name='add_category'),
    path('view-categories', view_categories, name='view_categories'),
    path('edit-category',edit_category,name='edit_category'),
    path('delete-category',delete_category,name='delete_category'),

    path('add-subcategory', add_subcategory, name='add_subcategory'),
    path('view-subcategories', view_subcategories, name='view_subcategories'),
    path('edit-subcategory',edit_subcategory,name='edit_subcategory'),
    path('delete-subcategory',delete_subcategory,name='delete_subcategory'),

    path('add-product',add_product,name='add_product'),
    path('add-product-specifications',add_product_specifications,name='add_product_specifications'),
    path('edit-product-specifications',edit_product_specifications,name='edit_product_specifications'),
    path('view-products',view_products,name='view_products'),
    path('view-product-details',view_product_details,name='view_product_details'),
    path('edit-product',edit_product,name='edit_product'),
    path('delete-product',delete_product,name='delete_product'),
    path('search-categories',search_categories,name='search_categories'),
    path('search-subcategories',search_subcategories,name='search_subcategories'),
    path('search-products',search_products,name='search_products'),
   
   
    path('customer-register', customer_register, name='customer_register'), 
    path('customer-login',customer_login,name='customer_login'), 
    path("google-login", google_login, name="google_login"),
    path('verify-email/<str:verification_link>/',verify_email, name='verify_email'),
    # path('google-verify-email/<str:verification_link>/',google_verify_email, name='google_verify_email'),
    path('google-submit-mobile',google_submit_mobile,name='google_submit_mobile'),
    path('otp-generate',otp_generate,name='otp_generate'),
    path('verify-otp',verify_otp,name='verify_otp'),
    path("set-new-password", set_new_password, name="set_new_password"),



    path('',view_categories_and_discounted_products,name='view_categories_and_discounted_products'),
    path('categories/view-sub-categories/', view_sub_categories_and_discounted_products, name='view_sub_categories_and_discounted_products'),
    path('categories/<str:category_name>/<str:sub_category_name>/',view_products_by_category_and_subcategory,name='view_products_by_category_and_subcategory'),
    path('view-product-details',view_product_details,name='view_product_details'),
    path('add-cart-product',add_product_to_cart,name='add_product_to_cart'),
    path('view-cart-products',view_product_cart,name='view_product_cart'),
    path('delete-cart-product',delete_product_cart,name='delete_product_cart'),
    path('delete-selected-products-cart',delete_selected_products_cart,name='delete_selected_products_cart'),
    path('add-customer-address',add_customer_address,name='add_customer_address'),
    path('view-customer-address',view_customer_address,name='view_customer_address'),
    path('edit-customer-address',edit_customer_address,name='edit_customer_address')
    
    





]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
