from django.db import models
from django.utils import timezone
from django.contrib.auth.hashers import make_password
import uuid
from datetime import datetime, timedelta


class PavamanAdminDetails(models.Model):
    username = models.CharField(max_length=120, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    status = models.IntegerField(default=1)

    def __str__(self):
        return self.username

class CategoryDetails(models.Model):
    category_name = models.CharField(max_length=120)
    created_at = models.DateTimeField()
    category_image = models.CharField(max_length=120)
    admin = models.ForeignKey(PavamanAdminDetails, on_delete=models.CASCADE)
    category_status = models.IntegerField(default=1)
    #category_url_id = models.CharField(default="")
    

    def __str__(self):
        return self.category_name

class SubCategoryDetails(models.Model):
    sub_category_name = models.CharField(max_length=120)
    created_at = models.DateTimeField()
    sub_category_image = models.CharField(max_length=120, blank=True, null=True)
    admin = models.ForeignKey(PavamanAdminDetails, on_delete=models.CASCADE)
    category = models.ForeignKey(CategoryDetails, on_delete=models.CASCADE)
    sub_category_status = models.IntegerField(default=1)
    #sub_category_url_id = models.CharField(default="")

    def __str__(self):
        return self.sub_category_name

class ProductsDetails(models.Model):
    product_name = models.CharField(max_length=200)
    sku_number = models.CharField(max_length=100, unique=True)
    price = models.FloatField()
    quantity = models.IntegerField(default=0)
    discount = models.FloatField(default=0.0)
    material_file = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField()
    number_of_specifications = models.IntegerField(default=0)
    specifications = models.JSONField(blank=True, null=True)
    product_images = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField()
    admin = models.ForeignKey(PavamanAdminDetails, on_delete=models.CASCADE)
    category = models.ForeignKey(CategoryDetails, on_delete=models.CASCADE)
    sub_category = models.ForeignKey(SubCategoryDetails, on_delete=models.CASCADE)
    status = models.IntegerField(default=1)
    availability = models.CharField(max_length=50, default="in_stock")
    product_status = models.IntegerField(default=1)
    cart_status = models.BooleanField(default=False)
    #product_url_id = models.CharField(default="")

    def __str__(self):
        return self.product_name

class CustomerRegisterDetails(models.Model):
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    mobile_no = models.CharField(max_length=15, unique=True)
    password = models.CharField(max_length=255,null=True, blank=True)
    status = models.IntegerField(default=1)
    register_status = models.IntegerField(default=0)
    created_on = models.DateTimeField(auto_now_add=True)
    verification_link = models.CharField(max_length=255, null=True, blank=True)
    admin = models.ForeignKey(PavamanAdminDetails, on_delete=models.CASCADE, null=True, blank=True)
    account_status = models.IntegerField(default=0)
    
    # Fields for OTP and Password Reset
    otp = models.IntegerField(null=True, blank=True)  # Store OTP
    otp_send_type = models.CharField(max_length=255, null=True, blank=True)  # Email/SMS
    reset_link = models.CharField(max_length=255, null=True, blank=True)  # Reset Token
    changed_on = models.DateTimeField(null=True, blank=True)  # Last Password Reset Time
    # def save(self, *args, **kwargs):
    #     if not self.password.startswith("pbkdf2_sha256$"):
    #         self.password = make_password(self.password)  # Ensure password is hashed
    #     super().save(*args, **kwargs)

    def save(self, *args, **kwargs):
        # Prevent hashing when password is None (Google Sign-In case)
        if self.password and not self.password.startswith("pbkdf2_sha256$"):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)
    def is_otp_valid(self):
        """Check if OTP is still valid (within 2 minutes)."""
        if self.changed_on:
            expiry_time = self.changed_on + timedelta(minutes=2)
            return timezone.now() < expiry_time  # Use timezone-aware datetime
        return False

    def clear_expired_otp(self):
        """Set OTP and reset_link to NULL if expired."""
        if not self.is_otp_valid():
            self.otp = None
            self.reset_link = None
            self.changed_on = None
            self.save()

    def _str_(self):
        return self.email
 
class CartProducts(models.Model):
    customer = models.ForeignKey(CustomerRegisterDetails, on_delete=models.CASCADE)
    product = models.ForeignKey(ProductsDetails, on_delete=models.CASCADE)
    category = models.ForeignKey(CategoryDetails, on_delete=models.CASCADE)
    sub_category = models.ForeignKey(SubCategoryDetails, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField()

    def __str__(self):
        return f"{self.customer} - {self.product} ({self.quantity})"

class CustomerAddress(models.Model):
    ADDRESS_TYPE_CHOICES = [
        ('home', 'Home'),
        ('work', 'Work'),
    ]

    customer = models.ForeignKey(CustomerRegisterDetails, on_delete=models.CASCADE, related_name="addresses")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    mobile_number = models.CharField(max_length=15)
    alternate_mobile = models.CharField(max_length=15, blank=True, null=True)
    address_type = models.CharField(max_length=10, choices=ADDRESS_TYPE_CHOICES, default='home')
    pincode = models.CharField(max_length=10)
    street = models.CharField(max_length=255)
    landmark = models.CharField(max_length=255,default="")
    village = models.CharField(max_length=255)
    mandal = models.CharField(max_length=255, blank=True, null=True)
    postoffice = models.CharField(max_length=255, blank=True, null=True)
    district = models.CharField(max_length=255, blank=True, null=True,default="")
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    latitude = models.CharField(max_length=100,default="")
    longitude = models.CharField(max_length=100,default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.address_type} ({self.pincode})"


