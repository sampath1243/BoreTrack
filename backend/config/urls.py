from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView
from core.auth_views import me
from core.auth_serializers import BoreTrackTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class BoreTrackTokenView(TokenObtainPairView):
    serializer_class = BoreTrackTokenObtainPairSerializer

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/token/", BoreTrackTokenView.as_view(), name="token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/me/", me, name="me"),
    path("api/", include("core.urls")),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
