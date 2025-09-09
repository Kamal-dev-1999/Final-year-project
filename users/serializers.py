# users/serializers.py

from rest_framework import serializers
from .models import User, UserSession
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

# This is the NEW serializer that contains the fix.
class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # The default validation runs first, authenticating the user
        data = super().validate(attrs)

        # `self.user` is now available on the serializer after successful validation
        user = self.user

        # Custom check: Ensure the user is an Admin
        if user.role != User.Role.ADMIN:
            raise serializers.ValidationError("You do not have permission to log in here.")

        # Single-device session logic: Update the session key for this admin
        refresh = self.get_token(user)
        session_key = refresh.get('jti')  # Get a unique identifier for the token

        UserSession.objects.update_or_create(
            user=user,
            defaults={'session_key': session_key}
        )
        
        # Add user data to the response
        user_data = UserSerializer(user).data
        data['user'] = user_data

        return data

# You can keep this serializer if you plan to have a registration endpoint
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role')
        read_only_fields = ('id', 'role')

class AdminRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=User.Role.ADMIN
        )
        return user

