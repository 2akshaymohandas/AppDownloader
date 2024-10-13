from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import AndroidApp, UserProfile, Task
from .serializers import UserSerializer, AndroidAppSerializer, UserProfileSerializer, TaskSerializer
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

@swagger_auto_schema(
    method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='Password'),
        },
        required=['username', 'password']
    ),
    responses={
        201: openapi.Response('Successful response', UserSerializer),
        400: 'Bad Request'
    }
)
@api_view(['POST'])
def signup(request):
    """
    Create a new user account.
    """
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user.set_password(request.data['password'])
        user.save()
        UserProfile.objects.create(user=user)
        token = Token.objects.create(user=user)
        return Response({'token': token.key, 'user': serializer.data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@swagger_auto_schema(
    method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='Password'),
        },
        required=['username', 'password']
    ),
    responses={
        200: openapi.Response('Successful login', UserSerializer),
        400: 'Invalid credentials'
    }
)
@api_view(['POST'])
def login(request):
    """
    Log in a user and return an authentication token.
    """
    user = User.objects.filter(username=request.data['username']).first()
    if user and user.check_password(request.data['password']):
        token, _ = Token.objects.get_or_create(user=user)
        serializer = UserSerializer(user)
        return Response({'token': token.key, 'user': serializer.data})
    return Response("Invalid credentials", status=status.HTTP_400_BAD_REQUEST)

@swagger_auto_schema(
    method='post',
    request_body=AndroidAppSerializer,
    responses={
        201: AndroidAppSerializer,
        400: 'Bad Request'
    },
    security=[{'Bearer': []}]
)
@api_view(['POST'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAdminUser])
def add_android_app(request):
    """
    Add a new Android app (admin only).
    """
    serializer = AndroidAppSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@swagger_auto_schema(
    method='get',
    responses={
        200: openapi.Response('Successful response', openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'user': openapi.Schema(type=openapi.TYPE_OBJECT, properties={
                    'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'username': openapi.Schema(type=openapi.TYPE_STRING),
                    # Add other user fields as needed
                }),
                'tasksCompleted': openapi.Schema(type=openapi.TYPE_INTEGER),
                'points_earned': openapi.Schema(type=openapi.TYPE_INTEGER),
                # Add other UserProfile fields as needed
            }
        )),
    },
    security=[{'Bearer': []}]
)
@api_view(['GET'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """
    Retrieve the profile of the authenticated user.
    """
    profile = UserProfile.objects.get(user=request.user)
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data)

@swagger_auto_schema(
    method='get',
    responses={
        200: openapi.Response('Successful response', openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'name': openapi.Schema(type=openapi.TYPE_STRING),
                    'points': openapi.Schema(type=openapi.TYPE_INTEGER),
                    # Add other AndroidApp fields as needed
                }
            )
        )),
    },
    security=[{'Bearer': []}]
)
@api_view(['GET'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_android_apps(request):
    """
    Retrieve a list of all Android apps.
    """
    apps = AndroidApp.objects.all()
    serializer = AndroidAppSerializer(apps, many=True)
    return Response(serializer.data)

@swagger_auto_schema(
    method='post',
    manual_parameters=[
        openapi.Parameter('task_id', openapi.IN_PATH, description="Task ID", type=openapi.TYPE_INTEGER),
    ],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'screenshot': openapi.Schema(type=openapi.TYPE_FILE, description='Screenshot file'),
        },
        required=['screenshot']
    ),
    responses={
        200: openapi.Response('Successful response', openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'message': openapi.Schema(type=openapi.TYPE_STRING),
                'task': openapi.Schema(type=openapi.TYPE_OBJECT, properties={
                    'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'completed': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    # Add other Task fields as needed
                }),
                'user_profile': openapi.Schema(type=openapi.TYPE_OBJECT, properties={
                    'tasksCompleted': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'points_earned': openapi.Schema(type=openapi.TYPE_INTEGER),
                    # Add other UserProfile fields as needed
                }),
            }
        )),
        400: 'Bad Request',
        404: 'Not Found'
    },
    security=[{'Bearer': []}]
)
@api_view(['POST'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def upload_screenshot(request, task_id):
    """
    Upload a screenshot for a specific task.
    """
    task = get_object_or_404(Task, id=task_id, user=request.user)
    
    if 'screenshot' in request.FILES:
        task.screenshot = request.FILES['screenshot']
        
        if not task.completed:
            task.completed = True
            task.save()
            
            profile = UserProfile.objects.get(user=request.user)
            profile.tasksCompleted += 1
            profile.save()
        
        task_serializer = TaskSerializer(task)
        profile_serializer = UserProfileSerializer(profile)
        
        return Response({
            "message": "Screenshot uploaded and task completed",
            "task": task_serializer.data,
            "user_profile": profile_serializer.data
        }, status=status.HTTP_200_OK)
    
    return Response({"error": "No screenshot provided"}, status=status.HTTP_400_BAD_REQUEST)

@swagger_auto_schema(
    method='get',
    responses={
        200: openapi.Response('Successful response', openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'user_profile': openapi.Schema(type=openapi.TYPE_OBJECT, properties={
                    'tasksCompleted': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'points_earned': openapi.Schema(type=openapi.TYPE_INTEGER),
                    # Add other UserProfile fields as needed
                }),
                'tasks': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'completed': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        # Add other Task fields as needed
                    }
                )),
            }
        )),
    },
    security=[{'Bearer': []}]
)
@api_view(['GET'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_user_tasks(request):
    """
    Retrieve all tasks for the authenticated user.
    """
    tasks = Task.objects.filter(user=request.user)
    task_serializer = TaskSerializer(tasks, many=True)
    
    user_profile, created = UserProfile.objects.get_or_create(user=request.user)
    profile_serializer = UserProfileSerializer(user_profile)
    
    response_data = {
        "user_profile": profile_serializer.data,
        "tasks": task_serializer.data
    }
    
    return Response(response_data, status=status.HTTP_200_OK)

@swagger_auto_schema(
    method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'app_id': openapi.Schema(type=openapi.TYPE_INTEGER, description='Android App ID'),
        },
        required=['app_id']
    ),
    responses={
        200: openapi.Response('Successful response', openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'message': openapi.Schema(type=openapi.TYPE_STRING),
                'points_earned': openapi.Schema(type=openapi.TYPE_INTEGER),
                'total_points': openapi.Schema(type=openapi.TYPE_INTEGER),
                'user_profile': openapi.Schema(type=openapi.TYPE_OBJECT, properties={
                    'tasksCompleted': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'points_earned': openapi.Schema(type=openapi.TYPE_INTEGER),
                    # Add other UserProfile fields as needed
                }),
            }
        )),
        400: 'Bad Request',
        404: 'Not Found'
    },
    security=[{'Bearer': []}]
)
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def download_app(request):
    """
    Download an Android app and create a new task for the user.
    """
    app_id = request.data.get('app_id')
    if not app_id:
        return Response({"error": "app_id is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    app = get_object_or_404(AndroidApp, id=app_id)
    user_profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    # Check if the user has already downloaded this app
    existing_task = Task.objects.filter(user=request.user, app=app).first()
    if existing_task:
        return Response({"error": "You have already downloaded this app"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create a new task
    Task.objects.create(user=request.user, app=app, completed=False)
    
    # Update user profile
    user_profile.points_earned += app.points
    user_profile.save()
    
    serializer = UserProfileSerializer(user_profile)
    return Response({
        "message": f"Successfully downloaded {app.name}",
        "points_earned": app.points,
        "total_points": user_profile.points_earned,
        "user_profile": serializer.data
    }, status=status.HTTP_200_OK)