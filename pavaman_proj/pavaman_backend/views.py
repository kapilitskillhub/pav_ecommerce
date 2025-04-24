
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import IntegrityError
import json
import os
from django.conf import settings
from pavaman_backend.models import PavamanAdminDetails, CategoryDetails,SubCategoryDetails,ProductsDetails
from datetime import datetime,timedelta
import shutil
from django.contrib.sessions.models import Session
import random 
from .sms_utils import send_bulk_sms 

@csrf_exempt
def add_admin(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get('username')
            email = data.get('email')
            mobile_no = data.get('mobile_no')
            password = data.get('password')
            status = data.get('status', 1)

            if not username or not email or not password:
                return JsonResponse({"error": "Username, email, and password are required.", "status_code": 400}, status=400)

            if PavamanAdminDetails.objects.filter(username=username).exists():
                return JsonResponse({"error": "Username already exists. Please choose a different username.", "status_code": 409}, status=409)

            if PavamanAdminDetails.objects.filter(email=email).exists():
                return JsonResponse({"error": "Email already exists. Please use a different email.", "status_code": 409}, status=409)

            admin = PavamanAdminDetails(username=username, email=email, password=password, status=int(status))
            admin.save()
            return JsonResponse({"message": "Admin added successfully", "id": admin.id, "status_code": 201}, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data in the request body.", "status_code": 400}, status=400)
        except IntegrityError:
            return JsonResponse({"error": "Database integrity error.", "status_code": 500}, status=500)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)

@csrf_exempt
def admin_login(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')

            if not email or not password:
                return JsonResponse({"error": "Email and password are required.", "status_code": 400}, status=400)

            admin = PavamanAdminDetails.objects.filter(email=email).first()

            if not admin:
                return JsonResponse({"error": "Email not found.", "status_code": 404}, status=404)
            if admin.password != password:
                return JsonResponse({"error": "Invalid email or password.", "status_code": 401}, status=401)

            if admin.status != 1:
                return JsonResponse({"error": "Your account is inactive. Contact support.", "status_code": 403}, status=403)
            otp = random.randint(100000, 999999)
            admin.otp = otp
            admin.save()
            
            success = send_otp_sms(admin.mobile_no, otp)
            if not success:
                return JsonResponse({"error": "Failed to send OTP. Try again later.", "status_code": 500}, status=500)
            return JsonResponse({
                "message": "OTP sent to your registered mobile number.",
                "status_code": 200,
                "email": admin.email  # Use this to verify in the next step
            }, status=200)
            # return JsonResponse({"message": "Login successful.", "username": admin.username, "email": admin.email, "id": admin.id, "status_code": 200}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data in the request body.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)

@csrf_exempt
def admin_verify_otp(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")
            otp = data.get("otp")

            if not email or not otp:
                return JsonResponse({"error": "Email and OTP are required.", "status_code": 400}, status=400)

            admin = PavamanAdminDetails.objects.filter(email=email).first()
            if not admin:
                return JsonResponse({"error": "Invalid email.", "status_code": 404}, status=404)
            if str(admin.otp) != str(otp):
                return JsonResponse({"error": "Invalid OTP.", "status_code": 401}, status=401)
            admin.otp = None
            admin.save()

            request.session['admin_id'] = admin.id
            request.session['admin_email'] = admin.email
            request.session['admin_username'] = admin.username
            request.session.modified = True

            # return JsonResponse({"message": "OTP verified. Login successful.", "status_code": 200}, status=200)
            return JsonResponse({"message": "OTP verified.Login successful.", "username": admin.username, "email": admin.email, "id": admin.id, "status_code": 200}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"Unexpected error: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Only POST method allowed.", "status_code": 405}, status=405)

def send_otp_sms(mobile_no, otp):
    message = f"Your OTP for admin login is: {otp}"
    try:
        send_bulk_sms([mobile_no], message)
        return True
    except Exception as e:
        print(f"Failed to send OTP to {mobile_no}: {e}")
        return False

@csrf_exempt
def admin_logout(request):
    if request.method == "POST":
        try:
            if 'admin_id' in request.session:
                request.session.flush()
                return JsonResponse({"message": "Logout successful.", "status_code": 200}, status=200)
            else:
                return JsonResponse({"error": "No active session found.", "status_code": 400}, status=400)

        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)



@csrf_exempt
def add_category(request):
    if request.method == 'POST':
        try:
            data = request.POST
            category_name = data.get('category_name').lower()
            admin_id = data.get('admin_id')
            category_status = 1

            if not admin_id:
                return JsonResponse({"error": "Admin is not logged in.", "status_code": 401}, status=401)

            try:
                admin_data = PavamanAdminDetails.objects.get(id=admin_id)
            except PavamanAdminDetails.DoesNotExist:
                return JsonResponse({"error": "Admin session expired or invalid.", "status_code": 401}, status=401)

            if CategoryDetails.objects.filter(category_name=category_name).exists():
                return JsonResponse({"error": "Category name already exists.", "status_code": 409}, status=409)

            if 'category_image' not in request.FILES:
                return JsonResponse({"error": "Category image file is required.", "status_code": 400}, status=400)

            category_image = request.FILES['category_image']
            allowed_extensions = ['png', 'jpg', 'jpeg']
            file_extension = category_image.name.split('.')[-1].lower()
            if file_extension not in allowed_extensions:
                return JsonResponse({"error": f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}", "status_code": 400}, status=400)

            image_name = f"{category_name}_{category_image.name}"
            image_name = image_name.replace('\\', '_')

            image_path = os.path.join('static', 'images', 'category', image_name)
            image_path = image_path.replace("\\", "/")

            full_path = os.path.join(settings.BASE_DIR, image_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)

            with open(full_path, 'wb') as f:
                for chunk in category_image.chunks():
                    f.write(chunk)

            current_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
            category = CategoryDetails(
                category_name=category_name, 
                admin=admin_data, 
                category_image=image_path,  # Store the path with forward slashes
                category_status=category_status,
                created_at=current_time
            )
            category.save()

            return JsonResponse({
                "message": "Category added successfully",
                "category_id": category.id,
                "category_image_url": f"/{image_path}",
                "category_status": category.category_status,
                "status_code": 201
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data in the request body.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)



@csrf_exempt
def view_categories(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            admin_id = data.get('admin_id')

            if not admin_id:
                return JsonResponse({"error": "Admin Id is required.", "status_code": 400}, status=400)

            admin_data = PavamanAdminDetails.objects.filter(id=admin_id).first()
            if not admin_data:
                return JsonResponse({"error": "Admin not found or session expired.", "status_code": 401}, status=401)

            categories = CategoryDetails.objects.filter(admin_id=admin_id,category_status=1)

            if not categories.exists():
                return JsonResponse({"message": "No category details found", "status_code": 200}, status=200)


            category_list = [
                {
                    "category_id": str(category.id),
                    "category_name": category.category_name,
                    "category_image_url": f"/static/images/category/{os.path.basename(category.category_image.replace('\\', '/'))}"
                }
                for category in categories
            ]


            return JsonResponse(
                {"message": "Categories retrieved successfully.", "categories": category_list, "status_code": 200},
                status=200
            )

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)



@csrf_exempt
def edit_category(request):
    if request.method == 'POST':
        try:
            data = request.POST
            category_id = data.get('category_id')
            category_name = data.get('category_name').lower()
            admin_id = data.get('admin_id')

            if not admin_id:
                return JsonResponse({"error": "Admin is not logged in.", "status_code": 401}, status=401)
            if not category_id:
                return JsonResponse({"error": "Category ID is required.", "status_code": 400}, status=400)

            admin_data = PavamanAdminDetails.objects.filter(id=admin_id).first()
            if not admin_data:
                return JsonResponse({"error": "Admin not found or session expired.", "status_code": 401}, status=401)

            category = CategoryDetails.objects.filter(id=category_id, admin=admin_data, category_status=1).first()
            if not category:
                return JsonResponse({"error": "Category not found.", "status_code": 404}, status=404)

            # if CategoryDetails.objects.filter(category_name=category_name,id=category_id).exists():
            #     return JsonResponse({"error": "Category name already exists.", "status_code": 409}, status=409)
            if CategoryDetails.objects.filter(category_name=category_name).exclude(id=category_id).exists():
                return JsonResponse({"error": "Category name already exists.", "status_code": 409}, status=409)

            category.category_name = category_name

            if 'category_image' in request.FILES:
                category_image = request.FILES['category_image']

                allowed_extensions = ['png', 'jpg', 'jpeg']
                file_extension = category_image.name.split('.')[-1].lower()
                if file_extension not in allowed_extensions:
                    return JsonResponse({
                        "error": f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}",
                        "status_code": 400
                    }, status=400)

                formatted_category_name = category_name.replace(' ', '_').replace('/', '_')
                image_name = f"{formatted_category_name}_{category_image.name}"

                image_path = os.path.join('static', 'images', 'category', image_name)
                image_path_full = os.path.join(settings.BASE_DIR, image_path)

                os.makedirs(os.path.dirname(image_path_full), exist_ok=True)
                with open(image_path_full, 'wb') as f:
                    for chunk in category_image.chunks():
                        f.write(chunk)
                category.category_image = image_path.replace("\\", "/")

            category.save()

            return JsonResponse({
                "message": "Category updated successfully.",
                "category_id": str(category.id),
                "category_name": category.category_name,
                "category_image_url": f"/{category.category_image}",
                "status_code": 200
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)


@csrf_exempt
def delete_category(request):
    if request.method == 'POST':
        try:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON data.", "status_code": 400}, status=400)

            category_id = data.get('category_id')
            admin_id = data.get('admin_id')

            print(f"Admin ID: {admin_id}, Category ID: {category_id}")

            if not admin_id:
                return JsonResponse({"error": "Admin is not logged in.", "status_code": 401}, status=401)

            if not category_id:
                return JsonResponse({"error": "Category ID is required.", "status_code": 400}, status=400)

            admin_data = PavamanAdminDetails.objects.filter(id=admin_id).first()
            if not admin_data:
                return JsonResponse({"error": "Admin not found or session expired.", "status_code": 401}, status=401)

            category = CategoryDetails.objects.filter(id=category_id, admin=admin_data).first()
            if not category:
                return JsonResponse({"error": "Category not found or you do not have permission to delete this category.", "status_code": 404}, status=404)

            if category.category_image:
                image_path = os.path.join(settings.BASE_DIR, category.category_image.replace('/', os.sep))
                if os.path.exists(image_path):
                    os.remove(image_path)

            category.delete()

            return JsonResponse({
                "message": "Category deleted successfully.",
                "status_code": 200
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)


@csrf_exempt
def add_subcategory(request):
    if request.method == 'POST':
        try:
            data = request.POST
            subcategory_name = data.get('subcategory_name').lower()
            category_id = data.get('category_id')
            admin_id = data.get('admin_id')
            subcategory_status = 1

            if not subcategory_name:
                return JsonResponse({"error": "Subcategory name is required.", "status_code": 400}, status=400)

            if not admin_id:
                return JsonResponse({"error": "Admin is not logged in.", "status_code": 401}, status=401)

            try:
                admin_data = PavamanAdminDetails.objects.get(id=admin_id)
            except PavamanAdminDetails.DoesNotExist:
                return JsonResponse({"error": "Admin session expired or invalid.", "status_code": 401}, status=401)

            try:
                category = CategoryDetails.objects.get(id=category_id, admin=admin_data)
            except CategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Category not found.", "status_code": 404}, status=404)

            if SubCategoryDetails.objects.filter(sub_category_name=subcategory_name, category=category).exists():
                return JsonResponse({
                    "error": f"Subcategory '{subcategory_name}' already exists under category '{category.category_name}'.",
                    "status_code": 409
                }, status=409)

            existing_subcategory = SubCategoryDetails.objects.filter(sub_category_name=subcategory_name).exclude(category=category).first()
            if existing_subcategory:
                return JsonResponse({
                    "error": f"Subcategory '{subcategory_name}' already exists under a different category '{existing_subcategory.category.category_name}'.",
                    "status_code": 409
                }, status=409)

            subcategory_image = request.FILES.get('sub_category_image', None)
            if not subcategory_image:
                return JsonResponse({"error": "Subcategory image file is required.", "status_code": 400}, status=400)

            allowed_extensions = ['png', 'jpg', 'jpeg']
            file_extension = subcategory_image.name.split('.')[-1].lower()
            if file_extension not in allowed_extensions:
                return JsonResponse({"error": f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}", "status_code": 400}, status=400)

            image_name = f"{subcategory_name}_{subcategory_image.name}".replace('\\', '_')
            image_path = os.path.join('static', 'images', 'subcategory', image_name).replace("\\", "/")

            full_path = os.path.join(settings.BASE_DIR, image_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)

            with open(full_path, 'wb') as f:
                for chunk in subcategory_image.chunks():
                    f.write(chunk)

            current_time = datetime.utcnow() + timedelta(hours=5, minutes=30)

            subcategory = SubCategoryDetails(
                sub_category_name=subcategory_name,
                category=category,
                sub_category_image=image_path,
                sub_category_status=subcategory_status,
                admin=admin_data,
                created_at=current_time
            )
            subcategory.save()

            return JsonResponse({
                "message": "Subcategory added successfully",
                "subcategory_id": subcategory.id,
                "category_id": category.id,
                "category_name": category.category_name,
                "subcategory_image_url": f"/{image_path}",
                "subcategory_status": subcategory.sub_category_status,
                "status_code": 201
            }, status=201)

        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)

@csrf_exempt
def view_subcategories(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            admin_id = data.get('admin_id')
            category_id = data.get('category_id')

            if not admin_id or not category_id:
                return JsonResponse({
                    "error": "Admin id and Category id are required.",
                    "status_code": 400
                }, status=400)

            try:
                admin = PavamanAdminDetails.objects.get(id=admin_id)
                category = CategoryDetails.objects.get(id=category_id, admin=admin)
            except PavamanAdminDetails.DoesNotExist:
                return JsonResponse({"error": "Admin not found or session expired.", "status_code": 404}, status=404)
            except CategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Category not found.", "status_code": 404}, status=404)

            subcategories = SubCategoryDetails.objects.filter(category=category).values(
                'id', 'sub_category_name', 'sub_category_image'
            )

            if not subcategories:
                return JsonResponse({
                    "message": "No subcategories found.",
                    "status_code": 200,
                    "subcategories": []
                }, status=200)

            return JsonResponse({
                "message": "Subcategories retrieved successfully.",
                "status_code": 200,
                "category_id": category.id,
                "category_name": category.category_name,
                "subcategories": list(subcategories)
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({
                "error": "Invalid JSON format.",
                "status_code": 400
            }, status=400)
        except Exception as e:
            return JsonResponse({
                "error": f"An unexpected error occurred: {str(e)}",
                "status_code": 500
            }, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)



@csrf_exempt
def edit_subcategory(request):
    if request.method == 'POST':
        try:
            data = request.POST
            subcategory_id = data.get('subcategory_id')
            sub_category_name = data.get('subcategory_name').lower()
            category_id = data.get('category_id')
            admin_id = data.get('admin_id')

            if not admin_id:
                return JsonResponse({"error": "Admin is not logged in.", "status_code": 401}, status=401)
            if not subcategory_id:
                return JsonResponse({"error": "Subcategory ID is required.", "status_code": 400}, status=400)
            if not sub_category_name:
                return JsonResponse({"error": "Subcategory Name is required.", "status_code": 400}, status=400)

            admin_data = PavamanAdminDetails.objects.filter(id=admin_id).first()
            if not admin_data:
                return JsonResponse({"error": "Admin not found or session expired.", "status_code": 401}, status=401)

            category = CategoryDetails.objects.filter(id=category_id, admin=admin_data).first()
            if not category:
                return JsonResponse({"error": "Category not found.", "status_code": 404}, status=404)

            subcategory = SubCategoryDetails.objects.filter(id=subcategory_id, category=category).first()
            if not subcategory:
                return JsonResponse({"error": "Subcategory not found.", "status_code": 404}, status=404)

            existing_subcategory = SubCategoryDetails.objects.filter(
                sub_category_name=sub_category_name, category=category
            ).exclude(id=subcategory_id).first()

            if existing_subcategory:
                return JsonResponse({
                    "error": f"Subcategory name already exists under {category.category_name}",
                    "status_code": 409
                }, status=409)

            subcategory.sub_category_name = sub_category_name

            # Handle the image upload only if provided.
            subcategory_image = request.FILES.get('sub_category_image', None)
            if subcategory_image:
                allowed_extensions = ['png', 'jpg', 'jpeg']
                # Use the correct attribute to get the file name.
                file_extension = subcategory_image.name.split('.')[-1].lower()

                if file_extension not in allowed_extensions:
                    return JsonResponse({"error": f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}", "status_code": 400}, status=400)

                # Generate a new image name using the sub_category_name and the original file name.
                image_name = f"{sub_category_name}_{subcategory_image.name}".replace('\\', '_')
                image_path = os.path.join('static', 'images', 'subcategory', image_name).replace("\\", "/")

                full_path = os.path.join(settings.BASE_DIR, image_path)
                os.makedirs(os.path.dirname(full_path), exist_ok=True)

                with open(full_path, 'wb') as f:
                    for chunk in subcategory_image.chunks():
                        f.write(chunk)

                subcategory.sub_category_image = image_path

            subcategory.save()

            return JsonResponse({
                "message": "Subcategory updated successfully.",
                "category_id": subcategory.category.id,
                "category_name": subcategory.category.category_name,
                "subcategory_id": subcategory.id,
                "subcategory_name": subcategory.sub_category_name,
                "subcategory_image_url": f"/static/{subcategory.sub_category_image}" if subcategory.sub_category_image else None,
                "status_code": 200
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)


@csrf_exempt
def delete_subcategory(request):
    if request.method == 'POST':
        try:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON data.", "status_code": 400}, status=400)

            subcategory_id = data.get('subcategory_id')
            category_id = data.get('category_id')
            admin_id = data.get('admin_id')

            print(f"Admin ID: {admin_id}, Category ID: {category_id}, Subcategory ID: {subcategory_id}")

            if not admin_id:
                return JsonResponse({"error": "Admin is not logged in.", "status_code": 401}, status=401)

            if not category_id:
                return JsonResponse({"error": "Category ID is required.", "status_code": 400}, status=400)

            if not subcategory_id:
                return JsonResponse({"error": "Subcategory ID is required.", "status_code": 400}, status=400)

            admin_data = PavamanAdminDetails.objects.filter(id=admin_id).first()
            if not admin_data:
                return JsonResponse({"error": "Admin not found or session expired.", "status_code": 401}, status=401)

            category = CategoryDetails.objects.filter(id=category_id, admin=admin_data).first()
            if not category:
                return JsonResponse({"error": "Category not found under this admin.", "status_code": 404}, status=404)

            subcategory = SubCategoryDetails.objects.filter(id=subcategory_id, category=category).first()
            if not subcategory:
                return JsonResponse({"error": "Subcategory not found.", "status_code": 404}, status=404)

            if subcategory.sub_category_image:
                image_path = os.path.join(settings.BASE_DIR, 'static', subcategory.sub_category_image)
                if os.path.exists(image_path):
                    os.remove(image_path)  # Delete image file from the server

            subcategory.delete()

            return JsonResponse({
                "message": "Subcategory deleted successfully.",
                "status_code": 200
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)


@csrf_exempt
def delete_subcategory(request):
    if request.method == 'POST':
        try:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON data.", "status_code": 400}, status=400)

            subcategory_id = data.get('subcategory_id')
            category_id = data.get('category_id')
            admin_id = data.get('admin_id')

            if not all([admin_id, category_id, subcategory_id]):
                return JsonResponse({"error": "All fields (admin_id, category_id, subcategory_id) are required.", "status_code": 400}, status=400)

            if not PavamanAdminDetails.objects.filter(id=admin_id).exists():
                return JsonResponse({"error": "Admin not found or session expired.", "status_code": 401}, status=401)

            category = CategoryDetails.objects.filter(id=category_id, admin_id=admin_id).first()
            if not category:
                return JsonResponse({"error": "Category not found.", "status_code": 404}, status=404)

            subcategory = SubCategoryDetails.objects.filter(id=subcategory_id, category=category).first()
            if not subcategory:
                return JsonResponse({"error": "Subcategory not found.", "status_code": 404}, status=404)

            if subcategory.sub_category_image:
                image_path = os.path.join(settings.MEDIA_ROOT, subcategory.sub_category_image)
                if os.path.exists(image_path):
                    os.remove(image_path)

            subcategory.delete()

            return JsonResponse({"message": "Subcategory deleted successfully.", "status_code": 200}, status=200)

        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)




@csrf_exempt
def add_product(request):
    if request.method == 'POST':
        try:
            if request.content_type == "application/json":
                try:
                    data = json.loads(request.body.decode('utf-8'))
                except json.JSONDecodeError:
                    return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)
            else:
                data = request.POST.dict()

            product_name = data.get('product_name').lower()
            sku_number = data.get('sku_number')
            price = data.get('price')
            quantity = data.get('quantity')
            discount = data.get('discount', 0.0)
            description = data.get('description')
            admin_id = data.get('admin_id')
            category_id = data.get('category_id')
            sub_category_id = data.get('sub_category_id')

            if not all([product_name, sku_number, price, quantity, description, admin_id, category_id, sub_category_id]):
                return JsonResponse({"error": "Missing required fields.", "status_code": 400}, status=400)

            try:
                price = float(price)
                quantity = int(quantity)
                discount = float(discount)

                if discount > price:
                    return JsonResponse({"error": "Discount amount cannot be more than the price.", "status_code": 400}, status=400)

            except ValueError:
                return JsonResponse({"error": "Invalid format for price, quantity, or discount.", "status_code": 400}, status=400)

            availability = "Out of Stock" if quantity == 0 else "Very Few Products Left" if quantity <= 5 else "In Stock"

            try:
                admin = PavamanAdminDetails.objects.get(id=admin_id)
            except PavamanAdminDetails.DoesNotExist:
                return JsonResponse({"error": "Admin not found.", "status_code": 401}, status=401)

            try:
                category = CategoryDetails.objects.get(id=category_id, admin=admin)
            except CategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Category not found", "status_code": 404}, status=404)

            try:
                sub_category = SubCategoryDetails.objects.get(id=sub_category_id, category=category)
            except SubCategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Sub-category not found.", "status_code": 404}, status=404)

            if ProductsDetails.objects.filter(product_name=product_name).exists():
                return JsonResponse({"error": "Product name already exists.", "status_code": 409}, status=409)

            if ProductsDetails.objects.filter(sku_number=sku_number).exists():
                return JsonResponse({"error": "SKU number already exists.", "status_code": 409}, status=409)

            product_images = []
            if 'product_images' not in request.FILES:
                return JsonResponse({"error": "Product images are required.", "status_code": 400}, status=400)

            image_files = request.FILES.getlist('product_images')
            if not image_files:
                return JsonResponse({"error": "At least one product image is required.", "status_code": 400}, status=400)

            product_folder = f"static/images/products/{product_name.replace(' ', '_')}"
            product_folder_path = os.path.join(settings.BASE_DIR, product_folder)
            os.makedirs(product_folder_path, exist_ok=True)

            allowed_image_extensions = ['png', 'jpg', 'jpeg']
            for image in image_files:
                file_extension = image.name.split('.')[-1].lower()
                if file_extension not in allowed_image_extensions:
                    return JsonResponse({"error": f"Invalid image file type. Allowed types: {', '.join(allowed_image_extensions)}", "status_code": 400}, status=400)

                image_name = f"{sku_number}_{image.name}"
                image_path = os.path.join(product_folder_path, image_name)

                with open(image_path, 'wb') as f:
                    for chunk in image.chunks():
                        f.write(chunk)

                product_images.append(f"{product_folder}/{image_name}")

            if 'material_file' not in request.FILES:
                return JsonResponse({"error": "Material file is required.", "status_code": 400}, status=400)

            material_file = request.FILES['material_file']
            allowed_material_extensions = ['pdf', 'doc']
            file_extension = material_file.name.split('.')[-1].lower()

            if file_extension not in allowed_material_extensions:
                return JsonResponse({"error": f"Invalid material file type. Allowed types: {', '.join(allowed_material_extensions)}", "status_code": 400}, status=400)

            material_file_name = f"{product_name.replace(' ', '_')}.{file_extension}"
            material_image_path = f'static/materials/{material_file_name}'
            material_image_full_path = os.path.join(settings.BASE_DIR, material_image_path)
            os.makedirs(os.path.dirname(material_image_full_path), exist_ok=True)

            with open(material_image_full_path, 'wb') as f:
                for chunk in material_file.chunks():
                    f.write(chunk)

            current_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
            product = ProductsDetails(
                product_name=product_name,
                sku_number=sku_number,
                price=price,
                quantity=quantity,
                discount=discount,
                description=description,
                admin=admin,
                category=category,
                sub_category=sub_category,
                product_images=product_images,
                material_file=material_image_path,
                availability=availability,
                created_at=current_time,
                product_status=1,
                cart_status=False  # Setting cart_status to False
            )
            product.save()

            return JsonResponse({
                "message": "Product added successfully.",
                "category_id": str(product.category.id),
                "category_name": product.category.category_name,
                "subcategory_id": str(product.sub_category.id),
                "sub_category_name": product.sub_category.sub_category_name,
                "product_id": str(product.id),
                "availability": availability,
                "status_code": 201
            }, status=201)

        except Exception as e:
            return JsonResponse({"error": f"Unexpected error: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid request method. Only POST is allowed.", "status_code": 405}, status=405)



@csrf_exempt
def add_product_specifications(request):
    if request.method == 'POST':
        try:
            try:
                data = json.loads(request.body.decode('utf-8'))
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)

            admin_id = data.get('admin_id')
            category_id = data.get('category_id')
            sub_category_id = data.get('sub_category_id')
            product_id = data.get('product_id')
            new_specifications = data.get('specifications', [])  # List of dictionaries

            if not all([admin_id, category_id, sub_category_id, product_id]):
                return JsonResponse({"error": "Missing required fields.", "status_code": 400}, status=400)
            try:
                admin = PavamanAdminDetails.objects.get(id=admin_id)
            except PavamanAdminDetails.DoesNotExist:
                return JsonResponse({"error": "Admin not found.", "status_code": 401}, status=401)

            try:
                category = CategoryDetails.objects.get(id=category_id, admin=admin)
            except CategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Category not found for this admin.", "status_code": 404}, status=404)

            try:
                sub_category = SubCategoryDetails.objects.get(id=sub_category_id, category=category)
            except SubCategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Subcategory not found for this category.", "status_code": 404}, status=404)

            try:
                product = ProductsDetails.objects.get(id=product_id, category=category, sub_category=sub_category)
            except ProductsDetails.DoesNotExist:
                return JsonResponse({"error": "Product not found.", "status_code": 404}, status=404)
            if not isinstance(new_specifications, list):
                return JsonResponse({"error": "Specifications must be a list of objects.", "status_code": 400}, status=400)

            existing_specifications = product.specifications or {}

            for spec in new_specifications:
                if "name" in spec and "value" in spec:
                    spec_name = spec["name"]
                    
                    if spec_name in existing_specifications:
                        return JsonResponse({
                            "error": f"Specification '{spec_name}' already exists.",
                            "status_code": 400
                        }, status=400)
                    
                    existing_specifications[spec_name] = spec["value"]
                else:
                    return JsonResponse({"error": "Each specification must contain 'name' and 'value'.", "status_code": 400}, status=400)

            product.specifications = existing_specifications
            product.number_of_specifications = len(existing_specifications)  # Update count
            product.save()

            return JsonResponse({
                "message": "New specifications added successfully.",
                "product_id": str(product.id),
                "number_of_specifications": product.number_of_specifications,
                "specifications": product.specifications,
                "status_code": 200
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": f"Unexpected error: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid request method. Only POST is allowed.", "status_code": 405}, status=405)

@csrf_exempt
def edit_product_specifications(request):
    if request.method == 'POST':
        try:
            try:
                data = json.loads(request.body.decode('utf-8'))
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)

            admin_id = data.get('admin_id')
            category_id = data.get('category_id')
            sub_category_id = data.get('sub_category_id')
            product_id = data.get('product_id')
            new_specifications = data.get('specifications', [])


            if not all([admin_id, category_id, sub_category_id, product_id]):
                return JsonResponse({"error": "Missing required fields.", "status_code": 400}, status=400)

            try:
                admin = PavamanAdminDetails.objects.get(id=admin_id)
            except PavamanAdminDetails.DoesNotExist:
                return JsonResponse({"error": "Admin not found.", "status_code": 401}, status=401)

            try:
                category = CategoryDetails.objects.get(id=category_id, admin=admin)
            except CategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Category not found for this admin.", "status_code": 404}, status=404)

            try:
                sub_category = SubCategoryDetails.objects.get(id=sub_category_id, category=category)
            except SubCategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Subcategory not found for this category.", "status_code": 404}, status=404)

            try:
                product = ProductsDetails.objects.get(id=product_id, category=category, sub_category=sub_category)
            except ProductsDetails.DoesNotExist:
                return JsonResponse({"error": "Product not found.", "status_code": 404}, status=404)

            if not isinstance(new_specifications, list):
                return JsonResponse({"error": "Specifications must be a list of objects.", "status_code": 400}, status=400)

            existing_specifications = product.specifications or {}

            for spec in new_specifications:
                if "name" in spec and "value" in spec:
                    existing_specifications[spec["name"]] = spec["value"]
                else:
                    return JsonResponse({"error": "Each specification must contain 'name' and 'value'.", "status_code": 400}, status=400)

            product.specifications = existing_specifications
            product.number_of_specifications = len(existing_specifications)  # Update count
            product.save()

            return JsonResponse({
                "message": "Specifications updated successfully.",
                "product_id": str(product.id),
                "number_of_specifications": product.number_of_specifications,
                "specifications": product.specifications,
                "status_code": 200
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": f"Unexpected error: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid request method. Only POST is allowed.", "status_code": 405}, status=405)

@csrf_exempt
def view_products(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            admin_id = data.get('admin_id')
            category_id = data.get('category_id')
            sub_category_id = data.get('sub_category_id')

            if not admin_id or not category_id or not sub_category_id:
                return JsonResponse({
                    "error": "admin_id, category_id, and sub_category_id are required.",
                    "status_code": 400
                }, status=400)

            try:
                admin = PavamanAdminDetails.objects.get(id=admin_id)
                category = CategoryDetails.objects.get(id=category_id, admin=admin)
                sub_category = SubCategoryDetails.objects.get(id=sub_category_id, category=category)
            except PavamanAdminDetails.DoesNotExist:
                return JsonResponse({"error": "Admin not found.", "status_code": 404}, status=404)
            except CategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Category not found.", "status_code": 404}, status=404)
            except SubCategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Subcategory not found.", "status_code": 404}, status=404)

            products = ProductsDetails.objects.filter(
                admin=admin, category=category, sub_category=sub_category
            ).values(
                'id', 'product_name', 'sku_number', 'price', 'availability', 'quantity', 'cart_status','product_images','discount','description'
            )

            product_list = []
            for product in products:
                product_list.append({
                    "product_id": str(product['id']),
                    "product_name": product['product_name'],
                    "sku_number": product['sku_number'],
                    "price": product['price'],
                    "availability": product['availability'],
                    "quantity": product['quantity'],
                    "cart_status":product['cart_status'],
                    "product_images": product['product_images'][0] if product['product_images'] else None,
                    "product_discount":product['discount'],
                    "product_description":product['description']
                })

            return JsonResponse({
                "message": "Products retrieved successfully.",
                "status_code": 200,
                "category_id": str(category.id),
                "category_name": category.category_name,
                "sub_category_id": str(sub_category.id),
                "sub_category_name": sub_category.sub_category_name,
                "products": product_list
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)

@csrf_exempt
def view_product_details(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            admin_id = data.get('admin_id')
            category_id = data.get('category_id')
            sub_category_id = data.get('sub_category_id')
            product_id = data.get('product_id')

            if not all([admin_id, category_id, sub_category_id, product_id]):
                return JsonResponse({
                    "error": "admin_id, category_id, sub_category_id, and product_id are required.",
                    "status_code": 400
                }, status=400)
            try:
                admin = PavamanAdminDetails.objects.get(id=admin_id)
                category = CategoryDetails.objects.get(id=category_id, admin=admin)
                sub_category = SubCategoryDetails.objects.get(id=sub_category_id, category=category)
                product = ProductsDetails.objects.get(id=product_id, admin=admin, category=category, sub_category=sub_category)
            except PavamanAdminDetails.DoesNotExist:
                return JsonResponse({"error": "Admin not found.", "status_code": 404}, status=404)
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
                "price": product.price,
                "availability": product.availability,
                "quantity": product.quantity,
                "description": product.description,
                "product_images": product.product_images,
                "material_file": product.material_file,
                "number_of_specifications": product.number_of_specifications,
                "specifications": product.specifications,
            }

            return JsonResponse({
                "message": "Product details retrieved successfully.",
                "status_code": 200,
                "category_id": str(category.id),
                "category_name": category.category_name,
                "sub_category_id": str(sub_category.id),
                "sub_category_name": sub_category.sub_category_name,
                "product_details": product_data
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)


# @csrf_exempt
# def view_product_details(request):
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body.decode('utf-8'))
#             admin_id = data.get('admin_id')
#             category_id = data.get('category_id')
#             sub_category_id = data.get('sub_category_id')
#             product_id = data.get('product_id')

#             if not all([admin_id, category_id, sub_category_id, product_id]):
#                 return JsonResponse({
#                     "error": "admin_id, category_id, sub_category_id, and product_id are required.",
#                     "status_code": 400
#                 }, status=400)
#             try:
#                 admin = PavamanAdminDetails.objects.get(id=admin_id)
#                 category = CategoryDetails.objects.get(id=category_id, admin=admin)
#                 sub_category = SubCategoryDetails.objects.get(id=sub_category_id, category=category)
#                 product = ProductsDetails.objects.get(id=product_id, admin=admin, category=category, sub_category=sub_category)
#             except PavamanAdminDetails.DoesNotExist:
#                 return JsonResponse({"error": "Admin not found.", "status_code": 404}, status=404)
#             except CategoryDetails.DoesNotExist:
#                 return JsonResponse({"error": "Category not found.", "status_code": 404}, status=404)
#             except SubCategoryDetails.DoesNotExist:
#                 return JsonResponse({"error": "Subcategory not found.", "status_code": 404}, status=404)
#             except ProductsDetails.DoesNotExist:
#                 return JsonResponse({"error": "Product not found.", "status_code": 404}, status=404)

#             product_data = {
#                 "product_id": str(product.id),
#                 "product_name": product.product_name,
#                 "sku_number": product.sku_number,
#                 "price": product.price,
#                 "availability": product.availability,
#                 "quantity": product.quantity,
#                 "description": product.description,
#                 "product_images": product.product_images,
#                 "material_file": product.material_file,
#                 "number_of_specifications": product.number_of_specifications,
#                 "specifications": product.specifications,
#             }

#             return JsonResponse({
#                 "message": "Product details retrieved successfully.",
#                 "status_code": 200,
#                 "category_id": str(category.id),
#                 "category_name": category.category_name,
#                 "sub_category_id": str(sub_category.id),
#                 "sub_category_name": sub_category.sub_category_name,
#                 "product_details": product_data
#             }, status=200)

#         except json.JSONDecodeError:
#             return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)
#         except Exception as e:
#             return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

#     return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)




@csrf_exempt
def edit_product(request):
    if request.method == 'POST':
        try:
            # Check if request is JSON
            if request.content_type == "application/json":
                try:
                    data = json.loads(request.body.decode('utf-8'))
                except json.JSONDecodeError:
                    return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)
            else:
                data = request.POST.dict()

            # Extract required fields
            admin_id = data.get('admin_id')
            category_id = data.get('category_id')
            sub_category_id = data.get('sub_category_id')
            product_id = data.get('product_id')
            product_name = data.get('product_name').lower()
            sku_number = data.get('sku_number')
            price = data.get('price')
            quantity = data.get('quantity')
            discount = data.get('discount', 0.0)
            description = data.get('description')

            # Ensure all required fields are present
            if not all([admin_id, category_id, sub_category_id, product_id, product_name, sku_number, price, quantity, description]):
                return JsonResponse({"error": "Missing required fields.", "status_code": 400}, status=400)

            # Convert price, quantity, and discount to proper types
            try:
                price = float(price)
                quantity = int(quantity)
                discount = float(discount)
            except ValueError:
                return JsonResponse({"error": "Invalid format for price, quantity, or discount.", "status_code": 400}, status=400)

            # Validate discount: it should not be greater than the price
            if discount > price:
                return JsonResponse({"error": "Discount cannot be greater than the price.", "status_code": 400}, status=400)

            # Determine product availability
            availability = "In Stock" if quantity > 5 else "Very Few Products Left" if quantity > 0 else "Out of Stock"

            # Validate admin
            try:
                admin = PavamanAdminDetails.objects.get(id=admin_id)
            except PavamanAdminDetails.DoesNotExist:
                return JsonResponse({"error": "Admin not found.", "status_code": 401}, status=401)

            # Validate category
            try:
                category = CategoryDetails.objects.get(id=category_id, admin=admin)
            except CategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Category not found.", "status_code": 404}, status=404)

            # Validate sub-category
            try:
                sub_category = SubCategoryDetails.objects.get(id=sub_category_id, category=category)
            except SubCategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Subcategory not found.", "status_code": 404}, status=404)

            # Validate product
            try:
                product = ProductsDetails.objects.get(id=product_id, category=category, sub_category=sub_category)
            except ProductsDetails.DoesNotExist:
                return JsonResponse({"error": "Product not found.", "status_code": 404}, status=404)

            # Ensure SKU number is unique
            if ProductsDetails.objects.exclude(id=product_id).filter(sku_number=sku_number).exists():
                return JsonResponse({"error": "SKU number already exists.", "status_code": 400}, status=400)

            # Ensure Product Name is unique
            if ProductsDetails.objects.exclude(id=product_id).filter(product_name=product_name).exists():
                return JsonResponse({"error": "Product name already exists.", "status_code": 400}, status=400)

            # Update product details
            old_product_name = product.product_name
            product.product_name = product_name
            product.sku_number = sku_number
            product.price = price
            product.quantity = quantity
            product.discount = discount
            product.description = description
            product.availability = availability
            product.cart_status = False  # Ensure cart_status is always False when updating

            # Handle product images upload
            product_images = []
            if 'product_images' in request.FILES:
                image_files = request.FILES.getlist('product_images')

                old_product_folder = f"static/images/products/{old_product_name.replace(' ', '_')}"
                new_product_folder = f"static/images/products/{product_name.replace(' ', '_')}"

                new_product_folder_path = os.path.join(settings.BASE_DIR, new_product_folder)
                os.makedirs(new_product_folder_path, exist_ok=True)

                for image in image_files:
                    allowed_extensions = ['png', 'jpg', 'jpeg']
                    file_extension = image.name.split('.')[-1].lower()
                    if file_extension not in allowed_extensions:
                        return JsonResponse({"error": f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}", "status_code": 400}, status=400)

                    image_name = f"{sku_number}_{image.name}"
                    image_path = os.path.join(new_product_folder_path, image_name)

                    with open(image_path, 'wb') as f:
                        for chunk in image.chunks():
                            f.write(chunk)

                    product_images.append(f"{new_product_folder}/{image_name}")

            product.product_images = product_images

            # Handle material file upload
            if 'material_file' in request.FILES:
                material_file = request.FILES['material_file']
                allowed_extensions = ['pdf', 'doc']
                file_extension = material_file.name.split('.')[-1].lower()

                if file_extension not in allowed_extensions:
                    return JsonResponse({"error": f"Invalid material file type. Allowed types: {', '.join(allowed_extensions)}", "status_code": 400}, status=400)

                material_file_name = f"{product_name.replace(' ', '_')}.{file_extension}"
                material_image_path = f'static/materials/{material_file_name}'
                material_image_full_path = os.path.join(settings.BASE_DIR, material_image_path)
                os.makedirs(os.path.dirname(material_image_full_path), exist_ok=True)

                with open(material_image_full_path, 'wb') as f:
                    for chunk in material_file.chunks():
                        f.write(chunk)

                product.material_file = material_image_path

            # Save the updated product details
            product.save()

            return JsonResponse({
                "message": "Product updated successfully.",
                "category_id": str(product.category.id),
                "category_name": product.category.category_name,
                "subcategory_id": str(product.sub_category.id),
                "sub_category_name": product.sub_category.sub_category_name,
                "product_id": str(product.id),
                "availability": availability,
                "cart_status": product.cart_status,  # Always False after update
                "status_code": 200
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": f"Unexpected error: {str(e)}", "status_code": 500}, status=500)

    else:
        return JsonResponse({"error": "Invalid request method. Only POST is allowed.", "status_code": 405}, status=405)


@csrf_exempt
def delete_product(request):
    if request.method == 'POST':
        try:
            if request.content_type == "application/json":
                try:
                    data = json.loads(request.body.decode('utf-8'))
                except json.JSONDecodeError:
                    return JsonResponse({"error": "Invalid JSON format.", "status_code": 400}, status=400)
            else:
                data = request.POST.dict()

            admin_id = data.get('admin_id')
            category_id = data.get('category_id')
            sub_category_id = data.get('sub_category_id')
            product_id = data.get('product_id')

            if not all([admin_id, category_id, sub_category_id, product_id]):
                return JsonResponse({"error": "Missing required fields.", "status_code": 400}, status=400)

            try:
                admin = PavamanAdminDetails.objects.get(id=admin_id)
            except PavamanAdminDetails.DoesNotExist:
                return JsonResponse({"error": "Admin not found.", "status_code": 401}, status=401)

            try:
                category = CategoryDetails.objects.get(id=category_id, admin=admin)
            except CategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Category not found.", "status_code": 404}, status=404)

            try:
                sub_category = SubCategoryDetails.objects.get(id=sub_category_id, category=category)
            except SubCategoryDetails.DoesNotExist:
                return JsonResponse({"error": "Sub-category not found.", "status_code": 404}, status=404)

            try:
                product = ProductsDetails.objects.get(id=product_id, category=category, sub_category=sub_category)
            except ProductsDetails.DoesNotExist:
                return JsonResponse({"error": "Product not found.", "status_code": 404}, status=404)

            product_folder = f"static/images/products/{product.product_name.replace(' ', '_')}"
            product_folder_path = os.path.join(settings.BASE_DIR, product_folder)
            if os.path.exists(product_folder_path):
                shutil.rmtree(product_folder_path)

            if product.material_file:
                material_file_path = os.path.join(settings.BASE_DIR, product.material_file).replace("\\", "/")

                if os.path.exists(material_file_path):
                    try:
                        os.remove(material_file_path)
                    except Exception as e:
                        return JsonResponse({"error":str(e), "status_code": 404}, status=404)
                else:
                    return JsonResponse({"error":str(e), "status_code": 404}, status=404)
            product.delete()

            return JsonResponse({
                "message": "Product and associated files deleted successfully.",
                "product_id": product_id,
                "status_code": 200
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": f"Unexpected error: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid request method. Only POST is allowed.", "status_code": 405}, status=405)


@csrf_exempt
def search_categories(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            admin_id = data.get('admin_id')
            search_query = data.get('category_name', '').strip()  # Get search term

            if not admin_id:
                return JsonResponse({"error": "Admin Id is required.", "status_code": 400}, status=400)

            if not search_query:
                return JsonResponse({"error": "Atleast one character is required.", "status_code": 400}, status=400)

            admin_data = PavamanAdminDetails.objects.filter(id=admin_id).first()
            if not admin_data:
                return JsonResponse({"error": "Admin not found or session expired.", "status_code": 401}, status=401)

            categories = CategoryDetails.objects.filter(
                admin_id=admin_id,
                category_status=1,
                category_name__icontains=search_query
            )

            if not categories.exists():
                return JsonResponse({"message": "No category details found", "status_code": 200}, status=200)

            category_list = [
                {
                    "category_id": str(category.id),
                    "category_name": category.category_name,
                    "category_image_url": f"/static/images/category/{os.path.basename(category.category_image.replace('\\', '/'))}"
                }
                for category in categories
            ]

            return JsonResponse(
                {"message": "Categories retrieved successfully.", "categories": category_list, "status_code": 200},
                status=200
            )

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)



@csrf_exempt
def search_subcategories(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            admin_id = data.get('admin_id')
            category_id = data.get('category_id')
            sub_category_name = data.get('sub_category_name', '').strip()

            if not admin_id:
                return JsonResponse({"error": "Admin Id is required.", "status_code": 400}, status=400)

            if not category_id:
                return JsonResponse({"error": "Category Id is required.", "status_code": 400}, status=400)

            if sub_category_name == "": 
                return JsonResponse({"error": "Atleast one character is required.", "status_code": 400}, status=400)

            admin_data = PavamanAdminDetails.objects.filter(id=admin_id).first()
            if not admin_data:
                return JsonResponse({"error": "Admin not found or session expired.", "status_code": 401}, status=401)

            subcategories = SubCategoryDetails.objects.filter(
                admin_id=admin_id,
                category_id=category_id,
                sub_category_status=1,
                sub_category_name__icontains=sub_category_name  # Partial match
            )

            if not subcategories.exists():
                return JsonResponse({"message": "No subcategory details found", "status_code": 200}, status=200)

            subcategory_list = [
                {
                    "sub_category_id": str(subcategory.id),
                    "sub_category_name": subcategory.sub_category_name,
                    "sub_category_image": f"/static/images/subcategory/{os.path.basename(subcategory.sub_category_image.replace('\\', '/'))}",
                    "category_id": str(subcategory.category_id)
                }
                for subcategory in subcategories
            ]

            return JsonResponse(
                {"message": "Subcategories retrieved successfully.", "subcategories": subcategory_list, "status_code": 200},
                status=200
            )

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)


@csrf_exempt
def search_products(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            admin_id = data.get('admin_id')
            category_id = data.get('category_id')
            sub_category_id = data.get('sub_category_id')
            product_name = data.get('product_name', '').strip()  # Optional search term

            if not admin_id:
                return JsonResponse({"error": "Admin ID are required.", "status_code": 400}, status=400)
            if not category_id:
                return JsonResponse({"error": "Category ID are required.", "status_code": 400}, status=400)
            if not sub_category_id:
                return JsonResponse({"error": "Sub Category ID are required.", "status_code": 400}, status=400)

            if product_name == "":
                return JsonResponse({"error": "Atleast one character is required.", "status_code": 400}, status=400)

            admin_data = PavamanAdminDetails.objects.filter(id=admin_id).first()
            if not admin_data:
                return JsonResponse({"error": "Admin not found or session expired.", "status_code": 401}, status=401)

            products = ProductsDetails.objects.filter(
                admin_id=admin_id,
                category_id=category_id,
                sub_category_id=sub_category_id,
                product_status=1
            )

            if product_name:
                products = products.filter(product_name__icontains=product_name)

            if not products.exists():
                return JsonResponse({"message": "No product details found", "status_code": 200}, status=200)

            product_list = []
            for product in products:
                product_images = product.product_images
                if isinstance(product_images, list):
                    product_image_url = (
                        f"/static/images/products/{os.path.basename(product_images[0].replace('\\', '/'))}"
                        if product_images else ""
                    )
                elif isinstance(product_images, str):
                    product_image_url = f"/static/images/products/{os.path.basename(product_images.replace('\\', '/'))}"
                else:
                    product_image_url = ""

                product_list.append({
                    "product_id": str(product.id),
                    "product_name": product.product_name,
                    "category_id": str(product.category_id),
                    "sub_category_id": str(product.sub_category_id),
                    "product_image_url": product_image_url,
                })

            return JsonResponse(
                {"message": "Products retrieved successfully.", "products": product_list, "status_code": 200},
                status=200
            )

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data.", "status_code": 400}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}", "status_code": 500}, status=500)

    return JsonResponse({"error": "Invalid HTTP method. Only POST is allowed.", "status_code": 405}, status=405)





# @csrf_exempt
# def admin_logout(request):
#     if request.method == "POST":
#         try:
#             if request.session.get('admin_id'):
#                 del request.session['admin_id']
#                 request.session.flush()

#                 return JsonResponse({
#                     "message": "Admin logged out successfully.",
#                     "status_code": 200
#                 }, status=200)

#             return JsonResponse({
#                 "error": "No active admin session found.",
#                 "status_code": 401
#             }, status=401)

#         except Exception as e:
#             return JsonResponse({
#                 "error": f"An unexpected error occurred: {str(e)}",
#                 "status_code": 500
#             }, status=500)

#     return JsonResponse({
#         "error": "Invalid HTTP method. Only POST is allowed.",
#         "status_code": 405
#     }, status=405)


