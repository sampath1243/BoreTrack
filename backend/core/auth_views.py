from django.contrib.auth.models import User
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from .auth_serializers import UserSerializer, UserCreateSerializer
from .models import UserProfile

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={"role": "owner" if request.user.is_staff or request.user.is_superuser else "worker"},
    )
    data = UserSerializer(request.user).data
    data["role"] = profile.role
    data["role_display"] = profile.get_role_display()
    return Response(data)

class UserViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]
    boretrack_module = "users"

    def list(self, request):
        users = User.objects.select_related("profile").order_by("username")
        for user in users:
            UserProfile.objects.get_or_create(user=user, defaults={"role": "owner" if user.is_staff else "worker"})
        return Response(UserSerializer(users, many=True).data)

    def create(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        try:
            user = User.objects.select_related("profile").get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        for field in ["first_name", "last_name", "email", "is_active"]:
            if field in request.data:
                setattr(user, field, request.data[field])
        for field in ["role", "phone", "job_title", "active"]:
            if field in request.data:
                setattr(profile, field, request.data[field])
        if "password" in request.data and request.data["password"]:
            user.set_password(request.data["password"])
        user.save(); profile.save()
        return Response(UserSerializer(user).data)
