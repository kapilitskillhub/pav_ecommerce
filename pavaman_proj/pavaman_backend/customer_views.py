from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import IntegrityError
# from .models import CustomerRegisterDetails, PavamanAdminDetails,CategoryDetails,ProductsDetails,SubCategoryDetails,Cart
from .models import (CustomerRegisterDetails, PavamanAdminDetails,CategoryDetails,ProductsDetails,
    SubCategoryDetails,CartProducts,CustomerAddress)
import threading
import random
from django.utils import timezone
import json
import re
import uuid
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.core.mail import send_mail
import requests
import os
from django.contrib.auth.hashers import make_password,check_password
from .sms_utils import send_bulk_sms  # Import SMS utility function

# from django.contrib.auth import login, get_user_model


# Password validation function
def is_valid_password(password):
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    if not any(char.isdigit() for char in password):
        return "Password must contain at least one digit."
    if not any(char.isupper() for char in password):
        return "Password must contain at least one uppercase letter."
    if not any(char.islower() for char in password):
        return "Password must contain at least one lowercase letter."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return "Password must contain at least one special character."
    return None  # Valid password

# Ensure passwords match
def match_password(password, re_password):
    if password != re_password:
        return "Passwords must be same."
    return None  # If passwords match, return None

@csrf_exempt
def customer_register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            email = data.get('email')
            mobile_no = data.get('mobile_no')
            password = data.get('password')
            re_password = data.get('re_password')
            status = 1
            register_status = 0
            verification_link = str(uuid.uuid4())  # Unique verification link
            
            # Validate required fields
            if not all([first_name, last_name, email, mobile_no, password, re_password]):
                return JsonResponse(
                    {"error": "first_name,last_name, email, mobile_no and password are required.", "status_code": 400}, status=400
                )

            # Validate password format
            password_error = is_valid_password(password)
            if password_error:
                return JsonResponse({"error": password_error, "status_code": 400}, status=400)

            # Validate password match
            mismatch_error = match_password(password, re_password)
            if mismatch_error:
                return JsonResponse({"error": mismatch_error, "status_code": 400}, status=400)

             # Ensure email and mobile_no are unique
            existing_customer = CustomerRegisterDetails.objects.filter(email=email).first()
            if existing_customer:
                if existing_customer.password is None:  # Registered via Google
                    return JsonResponse({"error": "This email was registered using Google Sign-In. Please reset your password to proceed.", "status_code": 409}, status=409)
                return JsonResponse({"error": "Email already exists. Please use a different email.", "status_code": 409}, status=409)
            
            # # Ensure email and mobile_no are unique
            # if CustomerRegisterDetails.objects.filter(email=email).exists():
            #     return JsonResponse({"error": "Email already exists. Please use a different email.", "status_code": 409}, status=409)
            if CustomerRegisterDetails.objects.filter(mobile_no=mobile_no).exists():
                return JsonResponse({"error": "Mobile number already exists. Please use a different mobile number.", "status_code": 409}, status=409)

            # Assign first admin (Ensure an admin exists)
            admin = PavamanAdminDetails.objects.order_by('id').first()
            if not admin:
                return JsonResponse({"error": "No admin found in the system.", "status_code": 500}, status=500)

            # Convert time to IST timezone
            current_time = datetime.utcnow() + timedelta(hours=5, minutes=30)

            # Create & Save customer
            customer = CustomerRegisterDetails(
                first_name=first_name,
                last_name=last_name,
                email=email,
                mobile_no=mobile_no,
                password=make_password(password),  # Secure password hashing
                status=int(status),
                register_status=int(register_status),
                created_on=current_time,
                admin=admin,
                verification_link=verification_link
            )
            customer.save()
            # Update register_status to 1 after mobile number is stored
            customer.register_status = 1
            customer.save(update_fields=['register_status'])
            # Send the verification email
            send_verification_email(email, verification_link)

            return JsonResponse(
                {
                    "message": "Account Created Successfully. Verification link sent to email.",
                    "id": customer.id,
                    "status_code": 201,
                }, status=201
            )

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data.", "status_code": 400}, status=400)
        except IntegrityError:
            return JsonResponse({"error": "Database integrity error.", "status_code": 500}, status=500)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST allowed.", "status_code": 405}, status=405)



#verify_email for both
@csrf_exempt
def verify_email(request, verification_link):
    try:
        # Get customer by verification link
        customer = get_object_or_404(CustomerRegisterDetails, verification_link=verification_link)

        # Update account status to 1 (verified)
        customer.account_status = 1  # Set account_status to 1 after verification
        customer.save()

        return JsonResponse({
            "message": "Account successfully verified.",
            "status_code": 200,
        }, status=200)
    
    except CustomerRegisterDetails.DoesNotExist:
        return JsonResponse({
            "error": "Invalid verification link.",
            "status_code": 400,
        }, status=400)

def send_verification_email(email, verification_link):
    subject = "Verify your email"
    message = f"Please click the link below to verify your email address:\n\n{settings.SITE_URL}/verify-email/{verification_link}/"
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])


@csrf_exempt
def customer_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return JsonResponse({"error": "Email and Password are required.", "status_code": 400}, status=400)

            try:
                customer = CustomerRegisterDetails.objects.get(email=email)
            except CustomerRegisterDetails.DoesNotExist:
                return JsonResponse({"error": "Invalid email or password.", "status_code": 401}, status=401)
            
            # Check if the customer registered via Google Sign-In
            if customer.password is None:
                return JsonResponse({"error": "You registered using Google Sign-In. Please reset your password.", "status_code": 401}, status=401)
            
            if customer.account_status != 1:
                return JsonResponse({"error": "Account is not activated. Please verify your email.", "status_code": 403}, status=403)

            if not check_password(password, customer.password):
                return JsonResponse({"error": "Invalid email or password.", "status_code": 401}, status=401)

            request.session['customer_id'] = customer.id
            request.session['email'] = customer.email
            request.session.set_expiry(3600)

            return JsonResponse(
                {"message": "Login successful.", 
                "customer_id": customer.id,
                "customer_name":customer.first_name + " " + customer.last_name,
                "customer_email":customer.email, 
                "status_code": 200}, status=200
            )

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST allowed.", "status_code": 405}, status=405)




# User = get_user_model()

@csrf_exempt
def google_login(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            token = data.get("token")

            if not token:
                return JsonResponse({"error": "Token is required"}, status=400)
            
            # Verify Google token
            google_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
            response = requests.get(google_url)
            
            if response.status_code != 200:
                return JsonResponse({"error": "Failed to verify token"}, status=400)

            user_info = response.json()

            if "error" in user_info:
                return JsonResponse({"error": "Invalid Token"}, status=400)

            # Extract user details
            email = user_info.get("email")
            first_name = user_info.get("given_name", "")
            last_name = user_info.get("family_name", "")

            if not email:
                return JsonResponse({"error": "Email is required"}, status=400)

            # # Check if customer exists, otherwise create one
            # customer, created = CustomerRegisterDetails.objects.get_or_create(
            #     email=email,
            #     defaults={
            #         "first_name": first_name,
            #         "last_name": last_name,
            #         "password": None,  # No password for Google login users
            #     },
            # )

            # return JsonResponse({
            #     "message": "Login successful",
            #     "new_user": created,  # True if new user, False if existing
            #     "user_id": customer.id,
            #     "email": customer.email,
            #     "first_name": customer.first_name,
            #     "last_name": customer.last_name,
            # })

            # Check if customer exists
            customer = CustomerRegisterDetails.objects.filter(email=email).first()

            if customer:
                if customer.account_status == 1:  # Verified Account
                    return JsonResponse({
                        "message": "Login successful",
                        "existing_user": True,
                        "user_id": customer.id,
                        "email": customer.email,
                        "first_name": customer.first_name,
                        "last_name": customer.last_name,
                    })
                else:
                    return JsonResponse({"error": "Account is not verified"}, status=403)

            # If no existing user, create a new Google account entry
            customer = CustomerRegisterDetails.objects.create(
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=None  # Google login users don't have a password
            )

            return JsonResponse({
                "message": "Account Created Successfully.Submit your mobile number.",
                "new_user": True,
                "user_id": customer.id,
                "email": customer.email,
                "first_name": customer.first_name,
                "last_name": customer.last_name,
            })

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def google_submit_mobile(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            mobile_no = data.get("mobile_no")

            if not user_id or not mobile_no:
                return JsonResponse({"error": "User ID and Mobile Number are required."}, status=400)
            if CustomerRegisterDetails.objects.filter(mobile_no=mobile_no).exists():
                return JsonResponse({"error": "Mobile number already exists. Please use a different mobile number.", "status_code": 409}, status=409)

            # Fetch user
            try:
                customer = CustomerRegisterDetails.objects.get(id=user_id)
            except CustomerRegisterDetails.DoesNotExist:
                return JsonResponse({"error": "User not found."}, status=404)

            if customer.register_status == 1:
                return JsonResponse({"error": "Mobile number already submitted."}, status=400)

            # Generate verification link
            verification_link = str(uuid.uuid4())
            customer.mobile_no = mobile_no
            customer.register_status = 1  # Mobile number is now added
            customer.verification_link = verification_link
            customer.save(update_fields=["mobile_no", "register_status", "verification_link"])

            # Send verification email
            send_verification_email(customer.email, verification_link)

            return JsonResponse({
                "message": "Mobile number saved. Verification email sent.",
                "user_id": customer.id,
                "register_status": customer.register_status,
            })

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)



def generate_reset_token():
    # Generate a unique reset token.
    return str(uuid.uuid4())

def delete_otp_after_delay(customer_id):
    # Delete OTP and reset token after 2 minutes.
    try:
        customer = CustomerRegisterDetails.objects.filter(id=customer_id).first()
        if customer:
            customer.otp = None
            customer.reset_link = None
            # customer.changed_on = None
            customer.save()
            print(f"OTP for {customer_id} deleted after 2 minutes ")
    except Exception as e:
        print(f"Error deleting OTP: {e}")


@csrf_exempt
def otp_generate(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            identifier = data.get("identifier")

            if not identifier:
                return JsonResponse({"error": "Email or Mobile number is required"}, status=400)

            customer = None
            otp_send_type = None

            if "@" in identifier:
                customer = CustomerRegisterDetails.objects.filter(email=identifier).first()
                otp_send_type = "email"
            else:
                # Just search the database using the number as it is (with country code)
                customer = CustomerRegisterDetails.objects.filter(mobile_no=identifier).first()
                otp_send_type = "mobile"

            if not customer:
                return JsonResponse({"error": "User not found"}, status=404)
            
            # **Check if account is verified (account_status=1)**
            if customer.account_status != 1:
                return JsonResponse({"error": "Account is not verified. Please verify your email first."}, status=403)


            # Generate OTP and Reset Token
            otp = random.randint(100000, 999999)
            reset_token = str(uuid.uuid4())

            customer.otp = otp
            customer.reset_link = reset_token
            customer.otp_send_type = otp_send_type  # Store OTP send type
            customer.changed_on = timezone.now()
            customer.save()

            # Start a background thread to delete OTP after 2 minutes
            threading.Timer(120, delete_otp_after_delay, args=[customer.id]).start()

            # Send OTP via email or SMS
            if otp_send_type == "email":
                send_mail(
                    "Your Password Reset OTP",
                    f"Your OTP for password reset is: {otp}",
                    settings.DEFAULT_FROM_EMAIL,
                    [customer.email],
                )
                return JsonResponse({"message": "OTP sent to email"})
            else:
                send_bulk_sms([identifier], f"Your OTP for password reset is: {otp}. Do not share this with anyone.")
                return JsonResponse({"message": "OTP sent to mobile number"})

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# @csrf_exempt
# def otp_generate(request):
#     if request.method == "POST":
#         try:
#             data = json.loads(request.body)
#             identifier = data.get("identifier")

#             if not identifier:
#                 return JsonResponse({"error": "Email or Mobile number is required"}, status=400)

#             customer = CustomerRegisterDetails.objects.filter(
#                 email=identifier
#             ).first() or CustomerRegisterDetails.objects.filter(
#                 mobile_no=identifier
#             ).first()

#             if not customer:
#                 return JsonResponse({"error": "User not found"}, status=404)

#             # Clear expired OTP if it's older than 2 minutes
#             customer.clear_expired_otp()

#             # Generate new OTP and reset token
#             otp = random.randint(100000, 999999)
#             reset_token = generate_reset_token()

#             # Store in database with updated timestamp
#             customer.otp = otp
#             customer.reset_link = reset_token
#             customer.changed_on = timezone.now()
#             # customer.save()

#             # Start a background thread to delete OTP after 2 minutes
#             threading.Timer(120, delete_otp_after_delay, args=[customer.id]).start()

#             if "@" in identifier:
#                 customer.otp_send_type = "email"  # Set otp_send_type to email
#                 customer.save()

#                 send_mail(
#                     "Your Password Reset OTP",
#                     f"Your OTP for password reset is: {otp}",
#                     settings.DEFAULT_FROM_EMAIL,
#                     [customer.email],
#                 )
#                 return JsonResponse({"message": "OTP sent to email"})

#             else:
#                 # print(f"OTP for {customer.mobile_no}: {otp}")  # Replace with SMS API
#                 # return JsonResponse({"message": "OTP sent to mobile number"})
                
#                 # If mobile number, send OTP via SMS
#                 if not customer.mobile_no.startswith("+"):
#                     customer.mobile_no = f"+91{customer.mobile_no}"  # Change +91 based on country

#                 sms_message = f"Your OTP for password reset is: {otp}. Do not share this with anyone."
#                 #Set otp_send_type to mobile before saving
#                 customer.otp_send_type = "mobile"
#                 customer.save()
                
#                 send_bulk_sms([customer.mobile_no], sms_message)  # Pass as a list
#                 return JsonResponse({"message": "OTP sent to mobile number"})


#         except json.JSONDecodeError:
#             return JsonResponse({"error": "Invalid JSON data"}, status=400)

#     return JsonResponse({"error": "Invalid request method"}, status=405)


# @csrf_exempt
# def verify_otp(request):
#     if request.method == "POST":
#         try:
#             data = json.loads(request.body)
#             identifier = data.get("identifier")  # Email or Mobile
#             otp = data.get("otp")
#             reset_link = data.get("reset_link")

#             if not identifier or not otp or not reset_link:
#                 return JsonResponse({"error": "Email/Mobile, OTP, and Reset Link are required"}, status=400)

#             # Find the customer
#             customer = CustomerRegisterDetails.objects.filter(
#                 email=identifier, reset_link=reset_link
#             ).first() or CustomerRegisterDetails.objects.filter(
#                 mobile_no=identifier, reset_link=reset_link
#             ).first()

#             if not customer:
#                 return JsonResponse({"error": "Invalid Reset Link"}, status=400)

#             # Clear expired OTP for this specific customer
#             customer.clear_expired_otp()

#             # Check if OTP is valid
#             if not customer.otp or str(customer.otp) != str(otp):
#                 return JsonResponse({"error": "Invalid OTP or OTP expired"}, status=400)

#             # OTP & Reset Link are valid, clear them
#             customer.otp = None
#             customer.reset_link = None
#             # customer.changed_on = None
#             customer.save()

#             return JsonResponse({"message": "OTP verified successfully"})

#         except json.JSONDecodeError:
#             return JsonResponse({"error": "Invalid JSON data"}, status=400)

#     return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def verify_otp(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            identifier = data.get("identifier")  # Email or Mobile
            otp = data.get("otp")
            reset_link = data.get("reset_link")

            if not identifier or not otp or not reset_link:
                return JsonResponse({"error": "Email/Mobile, OTP, and Reset Link are required"}, status=400)

            # Check if user exists
            customer = CustomerRegisterDetails.objects.filter(
                email=identifier
            ).first() or CustomerRegisterDetails.objects.filter(
                mobile_no=identifier
            ).first()

            if not customer:
                return JsonResponse({"error": "User not found with the provided email or mobile number"}, status=404)

            # Check if reset link is valid
            if not customer.reset_link:
                return JsonResponse({"error": "Reset link has expired or is missing"}, status=400)

            if customer.reset_link != reset_link:
                return JsonResponse({"error": "Invalid reset link for this user"}, status=400)

            # Clear expired OTP for this customer
            customer.clear_expired_otp()

            # Check if OTP is valid
            if not customer.otp or str(customer.otp) != str(otp):
                return JsonResponse({"error": "Invalid OTP or OTP has expired"}, status=400)

            # OTP & Reset Link are valid, clear them
            customer.otp = None
            customer.reset_link = None
            customer.save()

            return JsonResponse({"message": "OTP verified successfully"})

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def set_new_password(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            identifier = data.get("identifier")  # Email or Mobile
            new_password = data.get("new_password")
            confirm_password = data.get("confirm_password")

            if not identifier or not new_password or not confirm_password:
                return JsonResponse({"error": "Email/Mobile, New Password, and Confirm Password are required."}, status=400)

            # Find the user
            customer = CustomerRegisterDetails.objects.filter(
                email=identifier
            ).first() or CustomerRegisterDetails.objects.filter(
                mobile_no=identifier
            ).first()

            if not customer:
                return JsonResponse({"error": "User not found."}, status=404)

            # Validate password strength
            password_error = is_valid_password(new_password)
            if password_error:
                return JsonResponse({"error": password_error}, status=400)

            # Ensure new_password and confirm_password match
            match_error = match_password(new_password, confirm_password)
            if match_error:
                return JsonResponse({"error": match_error}, status=400)

            # Update the password securely
            customer.password = make_password(new_password)  # Hash the password before saving
            customer.save()

            return JsonResponse({"message": "Password updated successfully."})

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

    return JsonResponse({"error": "Invalid request method."}, status=405)


# @csrf_exempt
# def set_new_password(request):
#     if request.method == "POST":
#         try:
#             data = json.loads(request.body)
#             identifier = data.get("identifier")  # Email or Mobile
#             new_password = data.get("new_password")
#             confirm_password = data.get("confirm_password")

#             if not identifier or not new_password:
#                 return JsonResponse({"error": "Email/Mobile and New Password are required"}, status=400)

#             # Find the user
#             customer = CustomerRegisterDetails.objects.filter(
#                 email=identifier
#             ).first() or CustomerRegisterDetails.objects.filter(
#                 mobile_no=identifier
#             ).first()

#             if not customer:
#                 return JsonResponse({"error": "User not found"}, status=404)

            

#             # Validate password strength (optional)
#             if len(new_password) < 6:
#                 return JsonResponse({"error": "Password must be at least 6 characters long"}, status=400)
#             if new_password == confirm_password:
#                # Update the password
#                customer.password = make_password(new_password)  # Hash the password before saving
#                customer.save()

#             return JsonResponse({"message": "Password updated successfully"})

#         except json.JSONDecodeError:
#             return JsonResponse({"error": "Invalid JSON data"}, status=400)

#     return JsonResponse({"error": "Invalid request method"}, status=405)


# ===========


@csrf_exempt
def view_categories_and_discounted_products(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            customer_id = data.get('customer_id')
            categories = CategoryDetails.objects.filter(category_status=1)

            category_list = [
                {
                    "category_id": str(category.id),
                    "category_name": category.category_name,
                    "category_image_url": f"/static/images/category/{os.path.basename(category.category_image.replace('\\', '/'))}"
                }
                for category in categories
            ] if categories.exists() else []

            products = ProductsDetails.objects.filter(discount__gt=0, product_status=1)

            product_list = []
            for product in products:
                if isinstance(product.product_images, list) and product.product_images:
                    product_image_url = f"/static/images/products/{os.path.basename(product.product_images[0].replace('\\', '/'))}"
                else:
                    product_image_url = ""

                product_list.append({
                    "product_id": str(product.id),
                    "product_name": product.product_name,
                    "product_image_url": product_image_url,
                    "price": product.price,
                    "discount": product.discount,
                    "final_price": round(product.price - product.discount, 2)
                })

            response_data = {
                "message": "Data retrieved successfully.",
                "categories": category_list,
                "discounted_products": product_list,
                "status_code": 200
            }

            if customer_id:
                response_data["customer_id"] = customer_id

            return JsonResponse(response_data, status=200)

        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)


@csrf_exempt
def view_sub_categories_and_discounted_products(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            customer_id = data.get('customer_id')  # Optional field
            category_name = data.get('category_name')  # Required field

            if not category_name:
                return JsonResponse({"error": "Category name is required.", "status_code": 400}, status=400)

            category = CategoryDetails.objects.filter(category_name__iexact=category_name, category_status=1).first()
            if not category:
                return JsonResponse({"error": "Category not found or inactive.", "status_code": 404}, status=404)

            # Validate customer ID if provided
            if customer_id:
                customer_exists = CustomerRegisterDetails.objects.filter(id=customer_id, status=1).exists()
                if not customer_exists:
                    return JsonResponse({"error": "Customer not found.", "status_code": 401}, status=401)

            # Fetch active subcategories for the given category
            subcategories = SubCategoryDetails.objects.filter(category=category, sub_category_status=1)
            subcategory_list = [
                {
                    "sub_category_id": str(subcategory.id),
                    "sub_category_name": subcategory.sub_category_name,
                    "sub_category_image_url": f"/static/images/subcategory/{os.path.basename(subcategory.sub_category_image.replace('\\', '/'))}" 
                    if subcategory.sub_category_image else ""
                }
                for subcategory in subcategories
            ]

            # Fetch discounted products
            products = ProductsDetails.objects.filter(discount__gt=0, product_status=1)
            product_list = [
                {
                    "product_id": str(product.id),
                    "product_name": product.product_name,
                    "product_image_url": f"/static/images/products/{os.path.basename(product.product_images[0].replace('\\', '/'))}" 
                    if isinstance(product.product_images, list) and product.product_images else "",
                    "price": product.price,
                    "discount": product.discount,
                    "final_price": round(product.price - product.discount, 2)
                }
                for product in products
            ]

            # Construct the response data
            response_data = {
                "message": "Data retrieved successfully.",
                "category_id": category.id,
                "category_name": category_name,
                "subcategories": subcategory_list,
                "discounted_products": product_list,
                "status_code": 200
            }

            # Include customer_id only if valid
            if customer_id:
                response_data["customer_id"] = customer_id  

            return JsonResponse(response_data, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)

        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid request method. Use POST.", "status_code": 405}, status=405)

@csrf_exempt
def view_products_by_category_and_subcategory(request, category_name, sub_category_name):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            customer_id = data.get('customer_id')

            try:
                category = CategoryDetails.objects.get(category_name=category_name)
                sub_category = SubCategoryDetails.objects.get(sub_category_name=sub_category_name, category=category)
                if customer_id:
                    customer = CustomerRegisterDetails.objects.get(id=customer_id)
            except CustomerRegisterDetails.DoesNotExist:
                return JsonResponse({"error": "Customer not found.", "status_code": 404}, status=404)
            except CategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Category not found.", "status_code": 404}, status=404)
            except SubCategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Subcategory not found.", "status_code": 404}, status=404)

            # Fetch products
            products = ProductsDetails.objects.filter(
                category=category, sub_category=sub_category, product_status=1
            ).values(
                'id', 'product_name', 'sku_number', 'price', 'availability', 'quantity', 'product_images', 'discount', 'cart_status'
            )

            product_list = []
            for product in products:
                image_url = product['product_images'][0] if isinstance(product['product_images'], list) and product['product_images'] else None
                final_price = float(product['price']) - float(product.get('discount', 0))

                product_list.append({
                    "product_id": str(product['id']),
                    "product_name": product['product_name'],
                    "sku_number": product['sku_number'],
                    "price": float(product['price']),
                    "discount": float(product.get('discount', 0)),
                    "final_price": final_price,
                    "availability": product['availability'],
                    "quantity": product['quantity'],
                    "product_image_url": image_url,
                    "cart_status": product['cart_status']
                })

            response_data = {
                "message": "Products retrieved successfully.",
                "status_code": 200,
                "category_id":str(category.id),
                "category_name": category_name,
                "sub_category_id":str(sub_category.id),
                "sub_category_name": sub_category_name,
                "products": product_list
            }

            if customer_id:
                response_data["customer_id"] = str(customer_id)

            return JsonResponse(response_data, status=200)

        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Use POST.", "status_code": 405}, status=405)

@csrf_exempt
def view_product_details(request):
    if request.method == 'POST':
        try:
            # Load data from request body
            data = json.loads(request.body)
            customer_id = data.get('customer_id')
            category_id = data.get('category_id')
            sub_category_id = data.get('sub_category_id')
            product_id = data.get('product_id')

            if not all([category_id, sub_category_id, product_id]):
                return JsonResponse({
                    "error": "category_id, sub_category_id, and product_id are required.",
                    "status_code": 400
                }, status=400)

            try:
                category = CategoryDetails.objects.get(id=category_id)
                sub_category = SubCategoryDetails.objects.get(id=sub_category_id, category=category)
                product = ProductsDetails.objects.get(id=product_id, category=category, sub_category=sub_category)
                
                if customer_id:
                    try:
                        customer = CustomerRegisterDetails.objects.get(id=customer_id)
                    except CustomerRegisterDetails.DoesNotExist:
                        return JsonResponse({"error": "Customer not found.", "status_code": 404}, status=404)

            except CategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Category not found.", "status_code": 404}, status=404)
            except SubCategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Subcategory not found.", "status_code": 404}, status=404)
            except ProductsDetails.DoesNotExist:
                return JsonResponse({"error": "Product not found.", "status_code": 404}, status=404)

            product_data = {
                "product_id": str(product.id),
                "product_name": product.product_name,
                "sku_number": product.sku_number,
                "price": float(product.price),
                "availability": product.availability,
                "quantity": product.quantity,
                "description": product.description,
                "product_images": product.product_images,
                "material_file": product.material_file,
                "number_of_specifications": product.number_of_specifications,
                "specifications": product.specifications,
            }

            response_data = {
                "message": "Product details retrieved successfully.",
                "status_code": 200,
                "category_id": str(category.id),
                "category_name": category.category_name,
                "sub_category_id": str(sub_category.id),
                "sub_category_name": sub_category.sub_category_name,
                "product_details": product_data
            }

            if customer_id:
                response_data["customer_id"] = str(customer_id)

            return JsonResponse(response_data, status=200)

        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)


@csrf_exempt
def add_product_to_cart(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            customer_id = data.get('customer_id')
            product_id = data.get('product_id')

            quantity = max(int(data.get('quantity', 1)), 1)
            if not customer_id or not product_id:
                return JsonResponse({
                    "error": "customer_id and product_id are required.",
                    "status_code": 400
                }, status=400)

            try:
                customer = CustomerRegisterDetails.objects.get(id=customer_id)
                product = ProductsDetails.objects.get(id=product_id)
            except CustomerRegisterDetails.DoesNotExist:
                return JsonResponse({"error": "Customer not found.", "status_code": 404}, status=404)
            except ProductsDetails.DoesNotExist:
                return JsonResponse({"error": "Product not found.", "status_code": 404}, status=404)

            if not product.category or not product.sub_category:
                return JsonResponse({"error": "Product's category or subcategory is not set.", "status_code": 400}, status=400)

            if "stock" not in product.availability.lower() and "few" not in product.availability.lower():
                return JsonResponse({
                    "error": "Product is out of stock.",
                    "status_code": 400
                }, status=400)

            if product.quantity < quantity:
                return JsonResponse({
                    "error": "Requested quantity is unavailable.",
                    "status_code": 400
                }, status=400)

            current_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
            cart_item, created = CartProducts.objects.get_or_create(
                customer=customer,
                product=product,
                category=product.category,
                sub_category=product.sub_category,
                defaults={"quantity": quantity, "added_at": current_time}
            )

            if not created:
                cart_item.quantity += quantity
                cart_item.save()

            return JsonResponse({
                "message": "Product added to cart successfully.",
                "status_code": 200,
                "cart_id": cart_item.id,
                "product_id": product.id,
                "product_name": product.product_name,
                "quantity": cart_item.quantity,
                "total_price": float(product.price) * cart_item.quantity,
                "cart_status": True,  # This should be determined dynamically
                "category_id": product.category.id,
                "category_name": product.category.category_name,
                "sub_category_id": product.sub_category.id,
                "sub_category_name": product.sub_category.sub_category_name
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)


@csrf_exempt
def view_product_cart(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            customer_id = data.get('customer_id')
            # Fetch cart products for the given customer
            cart_items = CartProducts.objects.filter(customer_id=customer_id)

            if not cart_items.exists():
                return JsonResponse({"message": "Cart is empty.", "status_code": 200}, status=200)

            cart_data = []
            total_price = 0

            for item in cart_items:
                product = item.product
                item_total_price = float(product.price) * item.quantity
                total_price += item_total_price

                cart_data.append({
                    "cart_id": item.id,
                    "product_id": product.id,
                    "product_name": product.product_name,
                    "quantity": item.quantity,
                    "price_per_item": float(product.price),
                    "total_price": item_total_price,
                    "image": product.product_images if product.product_images else None,
                    "category": product.category.category_name if product.category else None,
                    "sub_category": product.sub_category.sub_category_name if product.sub_category else None
                })

            return JsonResponse({
                "message": "Cart retrieved successfully.",
                "status_code": 200,
                "customer_id": customer_id,
                "total_cart_value": total_price,
                "cart_items": cart_data
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only GET is allowed.", "status_code": 405}, status=405)

@csrf_exempt
def delete_product_cart(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            customer_id = data.get("customer_id")
            product_id = data.get("product_id")  # Optional

            if not customer_id:
                return JsonResponse({"error": "customer_id is required.", "status_code": 400}, status=400)

            if product_id:
                deleted_count, _ = CartProducts.objects.filter(customer_id=customer_id, product_id=product_id).delete()
                
                if deleted_count == 0:
                    return JsonResponse({"error": "Product not found in cart.", "status_code": 404}, status=404)
                if not CartProducts.objects.filter(product_id=product_id).exists():
                    product = ProductsDetails.objects.get(id=product_id)
                    product.cart_status = False
                    product.save()

                return JsonResponse({
                    "message": f"Product {product_id} removed from cart.",
                    "status_code": 200
                }, status=200)
            else:
                cart_items = CartProducts.objects.filter(customer_id=customer_id)
                if not cart_items.exists():
                    return JsonResponse({"message": "Cart is already empty.", "status_code": 200}, status=200)

                product_ids = cart_items.values_list('product_id', flat=True)
                cart_items.delete()
                ProductsDetails.objects.filter(id__in=product_ids).update(cart_status=False)

                return JsonResponse({
                    "message": "All products removed from cart.",
                    "status_code": 200
                }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)
        except ProductsDetails.DoesNotExist:
            return JsonResponse({"error": "Product not found.", "status_code": 404}, status=404)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)



@csrf_exempt
def delete_selected_products_cart(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            customer_id = data.get("customer_id")
            product_ids = data.get("product_ids", [])

            if not customer_id or not product_ids:
                return JsonResponse({"error": "customer_id and product_ids are required.", "status_code": 400}, status=400)

            deleted_count, _ = CartProducts.objects.filter(customer_id=customer_id, product_id__in=product_ids).delete()

            if deleted_count == 0:
                return JsonResponse({"error": "Products not found in cart.", "status_code": 404}, status=404)

            ProductsDetails.objects.filter(id__in=product_ids).update(cart_status=False)

            return JsonResponse({
                "message": f"{deleted_count} product(s) removed from cart.",
                "status_code": 200
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)

# API URLs
PINCODE_API_URL = "https://api.postalpincode.in/pincode/"
GEOLOCATION_API_URL = "https://nominatim.openstreetmap.org/search"



@csrf_exempt
def add_customer_address(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))

            # Extract required fields
            customer_id = data.get("customer_id")
            first_name = data.get("first_name")
            last_name = data.get("last_name")
            email = data.get("email")
            mobile_number = data.get("mobile_number")
            alternate_mobile = data.get("alternate_mobile", "")
            address_type = data.get("address_type", "home")
            pincode = data.get("pincode")
            street = data.get("street")
            landmark = data.get("landmark", "")

            if not all([customer_id, first_name, last_name, email, mobile_number, pincode, street]):
                return JsonResponse({"error": "All required fields must be provided.", "status_code": 400}, status=400)

            try:
                customer = CustomerRegisterDetails.objects.get(id=customer_id)
            except CustomerRegisterDetails.DoesNotExist:
                return JsonResponse({"error": "Customer does not exist.", "status_code": 400}, status=400)

            postoffice = mandal = village = district = state = country = ""
            latitude = longitude = None

            response = requests.get(f"{PINCODE_API_URL}{pincode}")
            if response.status_code == 200:
                pincode_data = response.json()
                if pincode_data and pincode_data[0].get("Status") == "Success":
                    post_office_data = pincode_data[0].get("PostOffice", [])[0] if pincode_data[0].get("PostOffice") else {}

                    postoffice = post_office_data.get("BranchType", "")
                    village = post_office_data.get("Name", "")
                    mandal = post_office_data.get("Block", "")
                    district = post_office_data.get("District", "")
                    state = post_office_data.get("State", "")
                    country = post_office_data.get("Country", "India")

            geo_params = {
                "q": f"{pincode},{district},{state},{country}",
                "format": "json",
                "limit": 1
            }

            geo_headers = {
                "User-Agent": "MyDjangoApp/1.0 saralkumar.kapilit@gmail.com"  # Replace with your email
            }

            geo_response = requests.get(GEOLOCATION_API_URL, params=geo_params, headers=geo_headers)

            if geo_response.status_code == 200:
                geo_data = geo_response.json()
                if geo_data:
                    latitude = geo_data[0].get("lat")
                    longitude = geo_data[0].get("lon")
                else:
                    return JsonResponse({"error": "Failed to fetch latitude and longitude for the provided address.", "status_code": 400}, status=400)
            else:
                return JsonResponse({"error": "Geolocation API request failed.", "status_code": geo_response.status_code}, status=geo_response.status_code)

            customer_address = CustomerAddress.objects.create(
                customer=customer,
                first_name=first_name,
                last_name=last_name,
                email=email,
                mobile_number=mobile_number,
                alternate_mobile=alternate_mobile,
                address_type=address_type,
                pincode=pincode,
                street=street,
                landmark=landmark,
                village=village,
                mandal=mandal,
                postoffice=postoffice,
                district=district,
                state=state,
                country=country,
                latitude=latitude,
                longitude=longitude
            )

            return JsonResponse({
                "message": "Customer address added successfully.",
                "status_code": 200,
                "address_id": customer_address.id,
                "pincode_details": {
                    "postoffice": postoffice,
                    "village": village,
                    "mandal": mandal,
                    "district": district,
                    "state": state,
                    "country": country,
                    "landmark": landmark,
                    "latitude": latitude,
                    "longitude": longitude
                }
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)


@csrf_exempt
def view_customer_address(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8"))
            customer_id = data.get("customer_id")

            if not customer_id:
                return JsonResponse({"error": "Customer ID is required.", "status_code": 400}, status=400)
            addresses = CustomerAddress.objects.filter(customer_id=customer_id)

            if not addresses.exists():
                return JsonResponse({"error": "No address found for the given customer ID.", "status_code": 404}, status=404)

            address_list = []
            for address in addresses:
                address_list.append({
                    "address_id": address.id,
                    "first_name": address.first_name,
                    "last_name": address.last_name,
                    "email": address.email,
                    "mobile_number": address.mobile_number,
                    "alternate_mobile": address.alternate_mobile,
                    "address_type": address.address_type,
                    "pincode": address.pincode,
                    "street": address.street,
                    "landmark": address.landmark,
                    "village": address.village,
                    "mandal": address.mandal,
                    "postoffice": address.postoffice,
                    "district": address.district,
                    "state": address.state,
                    "country": address.country,
                    "latitude": address.latitude,
                    "longitude": address.longitude
                })

            return JsonResponse({
                "message": "Customer addresses retrieved successfully.",
                "status_code": 200,
                "addresses": address_list
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)


GEOLOCATION_API_URL = "https://nominatim.openstreetmap.org/search"

@csrf_exempt
def edit_customer_address(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            address_id = data.get("address_id")
            customer_id = data.get("customer_id")
            first_name = data.get("first_name")
            last_name = data.get("last_name")
            email = data.get("email")
            mobile_number = data.get("mobile_number")
            alternate_mobile = data.get("alternate_mobile", "")
            address_type = data.get("address_type", "home")
            pincode = data.get("pincode")
            street = data.get("street")
            landmark = data.get("landmark", "")
            latitude = data.get("latitude")
            longitude = data.get("longitude")

            if not all([address_id, customer_id, first_name, last_name, email, mobile_number, pincode, street]):
                return JsonResponse({"error": "All required fields must be provided.", "status_code": 400}, status=400)

            try:
                customer_address = CustomerAddress.objects.get(id=address_id, customer_id=customer_id)
            except CustomerAddress.DoesNotExist:
                return JsonResponse({"error": "Address not found.", "status_code": 404}, status=404)
            try:
                response = requests.get(f"https://api.postalpincode.in/pincode/{pincode}")
                response_data = response.json()
                if response_data[0]['Status'] == 'Success':
                    post_office_data = response_data[0]['PostOffice'][0]
                    customer_address.village = post_office_data.get('Name', '')
                    customer_address.mandal = post_office_data.get('Block', '')
                    customer_address.postoffice = post_office_data.get('Name', '')
                    customer_address.district = post_office_data.get('District', '')
                    customer_address.state = post_office_data.get('State', '')
                    customer_address.country = post_office_data.get('Country', '')

                    if not latitude or not longitude:
                        geo_params = {
                            "q": f"{pincode},{customer_address.district},{customer_address.state},{customer_address.country}",
                            "format": "json",
                            "limit": 1
                        }
                        geo_headers = {
                            "User-Agent": "MyDjangoApp/1.0 saralkumar.kapilit@gmail.com"
                        }
                        geo_response = requests.get(GEOLOCATION_API_URL, params=geo_params, headers=geo_headers)

                        if geo_response.status_code == 200:
                            geo_data = geo_response.json()
                            if geo_data:
                                latitude = geo_data[0].get("lat", '')
                                longitude = geo_data[0].get("lon", '')
                            else:
                                return JsonResponse({"error": "Failed to fetch latitude and longitude for the provided address.", "status_code": 400}, status=400)
                        else:
                            return JsonResponse({"error": "Geolocation API request failed.", "status_code": geo_response.status_code}, status=geo_response.status_code)
            except Exception as e:
                return JsonResponse({"error": f"Failed to fetch address details: {str(e)}", "status_code": 500}, status=500)

            customer_address.first_name = first_name
            customer_address.last_name = last_name
            customer_address.email = email
            customer_address.mobile_number = mobile_number
            customer_address.alternate_mobile = alternate_mobile
            customer_address.address_type = address_type
            customer_address.pincode = pincode
            customer_address.street = street
            customer_address.landmark = landmark
            customer_address.latitude = latitude
            customer_address.longitude = longitude

            customer_address.save(update_fields=[
                "first_name", "last_name", "email", "mobile_number",
                "alternate_mobile", "address_type", "pincode", "street",
                "landmark", "village", "mandal", "postoffice", 
                "district", "state", "country", "latitude", "longitude"
            ])

            return JsonResponse({
                "message": "Customer address updated successfully.",
                "status_code": 200,
                "address_id": customer_address.id,
                "pincode_details": {
                    "postoffice": customer_address.postoffice,
                    "village": customer_address.village,
                    "mandal": customer_address.mandal,
                    "district": customer_address.district,
                    "state": customer_address.state,
                    "country": customer_address.country,
                    "landmark": customer_address.landmark,
                    "latitude": customer_address.latitude,
                    "longitude": customer_address.longitude
                }
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)

@csrf_exempt
def delete_customer_address(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            address_id = data.get("address_id")
            customer_id = data.get("customer_id")

            if not address_id or not customer_id:
                return JsonResponse({"error": "Address ID and Customer ID are required.", "status_code": 400}, status=400)

            try:
                customer_address = CustomerAddress.objects.get(id=address_id, customer_id=customer_id)
                customer_address.delete()
                return JsonResponse({"message": "Customer address deleted successfully.", "status_code": 200}, status=200)
            except CustomerAddress.DoesNotExist:
                return JsonResponse({"error": "Address not found.", "status_code": 404}, status=404)
        
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)


#mmmmmmmmm
#llllll