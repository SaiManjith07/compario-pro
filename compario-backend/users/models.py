"""Custom User Model for Compario."""

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone


class CustomUserManager(BaseUserManager):
    """
    Custom manager for User model where email is the unique identifier
    instead of username.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a regular user with email and password.
        """
        if not email:
            raise ValueError('Users must have an email address')
        
        # Normalize email (lowercase domain part)
        email = self.normalize_email(email)
        
        # Create user instance
        user = self.model(email=email, **extra_fields)
        
        # Hash password
        user.set_password(password)
        
        # Save to database
        user.save(using=self._db)
        
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a superuser with email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True')
        
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model that uses email instead of username for authentication.
    Stores user data in PostgreSQL.
    """
    
    email = models.EmailField(
        verbose_name='email address',
        max_length=255,
        unique=True,
        db_index=True,
        help_text='User email address (used for login)'
    )
    
    first_name = models.CharField(
        max_length=150,
        blank=True,
        help_text='User first name'
    )
    
    last_name = models.CharField(
        max_length=150,
        blank=True,
        help_text='User last name'
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text='Designates whether this user should be treated as active'
    )
    
    is_staff = models.BooleanField(
        default=False,
        help_text='Designates whether the user can log into admin site'
    )
    
    date_joined = models.DateTimeField(
        default=timezone.now,
        help_text='Date when user registered'
    )
    
    last_login = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Last login timestamp'
    )
    
    # Address fields for delivery estimates
    address_line1 = models.CharField(
        max_length=255,
        blank=True,
        help_text='Address line 1 (House/Flat No., Building Name)'
    )
    
    address_line2 = models.CharField(
        max_length=255,
        blank=True,
        help_text='Address line 2 (Street, Area, Landmark)'
    )
    
    city = models.CharField(
        max_length=100,
        blank=True,
        help_text='City'
    )
    
    state = models.CharField(
        max_length=100,
        blank=True,
        help_text='State'
    )
    
    pincode = models.CharField(
        max_length=10,
        blank=True,
        help_text='Pincode'
    )
    
    country = models.CharField(
        max_length=100,
        default='India',
        help_text='Country'
    )
    
    # Specify custom manager
    objects = CustomUserManager()
    
    # Use email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Email is already required as USERNAME_FIELD
    
    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['-date_joined']),
        ]
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        """
        Return the first_name and last_name with a space in between.
        """
        full_name = f'{self.first_name} {self.last_name}'.strip()
        return full_name or self.email
    
    def get_short_name(self):
        """
        Return the first name for the user.
        """
        return self.first_name or self.email.split('@')[0]
