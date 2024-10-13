from django.urls import re_path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from . import views

schema_view = get_schema_view(
   openapi.Info(
      title="Android App API",
      default_version='v1',
      description="API for Android App Download and Task Management",
      terms_of_service="https://www.yourapp.com/terms/",
      contact=openapi.Contact(email="contact@yourapp.com"),
      license=openapi.License(name="Your License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    re_path('signup/', views.signup, name='signup'),
    re_path('login/', views.login, name='login'),
    re_path('add_android_app/', views.add_android_app, name='add_android_app'),
    re_path('get_user_profile/', views.get_user_profile, name='get_user_profile'),
    re_path('get_android_apps/', views.get_android_apps, name='get_android_apps'),
    re_path(r'^upload_screenshot/(?P<task_id>\d+)/$', views.upload_screenshot, name='upload_screenshot'),
    re_path('download_app/', views.download_app, name='download_app'),
    re_path('get_user_tasks/', views.get_user_tasks, name='get_user_tasks'),
    
    # Swagger documentation URLs
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]