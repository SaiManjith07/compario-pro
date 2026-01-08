"""Authentication API Views."""

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    PasswordChangeSerializer
)
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class SignUpView(APIView):
    """
    API endpoint for user registration.
    POST /api/auth/signup/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Register a new user.
        """
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens for the new user
            refresh = RefreshToken.for_user(user)
            
            logger.info(f"New user registered: {user.email}")
            
            return Response(
                {
                    'success': True,
                    'message': 'User registered successfully',
                    'user': UserProfileSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            {
                'success': False,
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class LoginView(APIView):
    """
    API endpoint for user login.
    POST /api/auth/login/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Authenticate user and return JWT tokens.
        """
        serializer = UserLoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Update last login
            from django.utils import timezone
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            logger.info(f"User logged in: {user.email}")
            
            return Response(
                {
                    'success': True,
                    'message': 'Login successful',
                    'user': UserProfileSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                },
                status=status.HTTP_200_OK
            )
        
        return Response(
            {
                'success': False,
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class LogoutView(APIView):
    """
    API endpoint for user logout.
    POST /api/auth/logout/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Logout user by blacklisting refresh token.
        """
        try:
            refresh_token = request.data.get('refresh_token')
            
            if not refresh_token:
                return Response(
                    {
                        'success': False,
                        'error': 'Refresh token is required'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Blacklist the token
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            logger.info(f"User logged out: {request.user.email}")
            
            return Response(
                {
                    'success': True,
                    'message': 'Logged out successfully'
                },
                status=status.HTTP_200_OK
            )
        
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return Response(
                {
                    'success': False,
                    'error': 'Invalid or expired token'
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class ProfileView(APIView):
    """
    API endpoint for user profile.
    GET /api/auth/profile/ - Get current user profile
    PUT /api/auth/profile/ - Update current user profile
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get current user profile.
        """
        serializer = UserProfileSerializer(request.user)
        return Response(
            {
                'success': True,
                'user': serializer.data
            },
            status=status.HTTP_200_OK
        )
    
    def put(self, request):
        """
        Update current user profile.
        """
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            
            logger.info(f"User profile updated: {request.user.email}")
            
            return Response(
                {
                    'success': True,
                    'message': 'Profile updated successfully',
                    'user': UserProfileSerializer(request.user).data
                },
                status=status.HTTP_200_OK
            )
        
        return Response(
            {
                'success': False,
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class PasswordChangeView(APIView):
    """
    API endpoint for changing password.
    POST /api/auth/change-password/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Change user password.
        """
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            
            logger.info(f"Password changed for user: {request.user.email}")
            
            return Response(
                {
                    'success': True,
                    'message': 'Password changed successfully'
                },
                status=status.HTTP_200_OK
            )
        
        return Response(
            {
                'success': False,
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
