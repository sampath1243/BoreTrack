from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserProfile

class BoreTrackTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={"role": "owner" if user.is_staff or user.is_superuser else "worker"},
        )
        token["role"] = profile.role
        token["username"] = user.username
        token["is_staff"] = user.is_staff
        return token

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="profile.role", read_only=True)
    role_display = serializers.CharField(source="profile.get_role_display", read_only=True)
    phone = serializers.CharField(source="profile.phone", read_only=True)
    job_title = serializers.CharField(source="profile.job_title", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "is_active", "role", "role_display", "phone", "job_title"]

class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=UserProfile.ROLE, default="worker")
    phone = serializers.CharField(required=False, allow_blank=True)
    job_title = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def create(self, validated_data):
        role = validated_data.pop("role", "worker")
        phone = validated_data.pop("phone", "")
        job_title = validated_data.pop("job_title", "")
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        if role == "owner":
            user.is_staff = True
            user.save(update_fields=["is_staff"])
        UserProfile.objects.create(user=user, role=role, phone=phone, job_title=job_title)
        return user
