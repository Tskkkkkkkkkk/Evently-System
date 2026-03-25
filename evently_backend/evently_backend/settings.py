import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

<<<<<<< HEAD

=======
# Load .env from project root so EMAIL_* and other vars can be set without exporting
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / ".env")
except ImportError:
    pass

SECRET_KEY = "django-insecure-ace2euik^y_6akq!i-qk#81clf0@pp+zg4$0u7clt0eervhe22"

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
<<<<<<< HEAD
 
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',

=======
    # Third-party
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    # Local
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
    'accounts',
]

MIDDLEWARE = [
<<<<<<< HEAD
    'corsheaders.middleware.CorsMiddleware',        
=======
    'corsheaders.middleware.CorsMiddleware',        # must be first
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = "evently_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
<<<<<<< HEAD
        "DIRS": [BASE_DIR / "frontend" / "build"],  
=======
        "DIRS": [BASE_DIR / "frontend" / "build"],   # ← React build folder
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "evently_backend.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
<<<<<<< HEAD
        "rest_framework.permissions.AllowAny",   
=======
        "rest_framework.permissions.AllowAny",   # views override with IsAuthenticated where needed
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

<<<<<<< HEAD

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "evently")
=======
# PyMongo helper (profiles, etc.)
MONGO_URI = "mongodb://localhost:27017"
MONGO_DB_NAME = "evently"
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


CORS_ALLOWED_ORIGINS = [
<<<<<<< HEAD
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
=======
    "http://localhost:3000",   # React dev server
    "http://127.0.0.1:3000",
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
]
CORS_ALLOW_CREDENTIALS = True


if os.environ.get("EMAIL_HOST"):
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
    EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "true").lower() in ("1", "true", "yes")
    EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
    EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
    DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER or "noreply@evently.local")
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    DEFAULT_FROM_EMAIL = "noreply@evently.local"