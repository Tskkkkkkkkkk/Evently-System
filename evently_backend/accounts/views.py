import json
import logging
import os
import re
import uuid
import urllib.request
import secrets
import base64
import hashlib
import hmac
from io import BytesIO
from urllib.parse import urlencode
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.http import HttpResponseRedirect
from PIL import Image

logger = logging.getLogger(__name__)

from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from slugify import slugify
from bson import ObjectId

from evently_backend.mongo_client import mongo_db, is_mongo_connected
from .serializers import LoginSerializer, RegisterSerializer, VenueSerializer
from .permissions import IsAdmin

User = get_user_model()

# ─────────────────────────────────────────────────────────────────────────────
# General helpers
# ─────────────────────────────────────────────────────────────────────────────

def _split_full_name(full_name: str):
    parts = (full_name or "").strip().split()
    if not parts:
        return "", ""
    return parts[0], " ".join(parts[1:])


def _username_from_email(email: str) -> str:
    base = (email or "user").split("@")[0].strip() or "user"
    candidate = base
    i = 1
    while User.objects.filter(username=candidate).exists():
        i += 1
        candidate = f"{base}{i}"
    return candidate


def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


def _unique_slug(name: str, existing_id=None) -> str:
    base = slugify(name) or "venue"
    slug = base
    i = 1
    while True:
        found = mongo_db["venues"].find_one({"slug": slug})
        if not found or (existing_id and str(found.get("_id")) == str(existing_id)):
            return slug
        slug = f"{base}-{i}"
        i += 1


def _venue_out(doc: dict) -> dict:
    if doc is None:
        return {}
    doc["id"] = str(doc.pop("_id", ""))
    return doc


def _event_out(doc: dict) -> dict:
    if doc is None:
        return {}
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id", ""))
    return doc


def _normalize_emails(emails) -> list:
    if not emails:
        return []
    out = []
    seen = set()
    email_re = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    for e in emails:
        addr = (e or "").strip().lower()
        if addr and email_re.match(addr) and addr not in seen:
            seen.add(addr)
            out.append(addr)
    return out



def _generate_otp(email: str) -> str:
    import random
    otp = str(random.randint(100000, 999999))
    cache.set(f"otp:{email.lower().strip()}", otp, timeout=600)
    return otp


def _verify_otp(email: str, otp: str) -> bool:
    key = f"otp:{email.lower().strip()}"
    stored = cache.get(key)
    if stored and stored == otp.strip():
        cache.delete(key)
        return True
    return False


def _send_otp_email(email: str, otp: str):
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@evently.local")
    send_mail(
        subject="Your Evently verification code",
        message=(
            f"Your one-time verification code is: {otp}\n\n"
            "This code expires in 10 minutes. Do not share it with anyone."
        ),
        from_email=from_email,
        recipient_list=[email],
        fail_silently=False,
    )


# ─────────────────────────────────────────────────────────────────────────────
# RSVP helpers
# ─────────────────────────────────────────────────────────────────────────────

def _generate_rsvp_token(event_id: str, guest_email: str) -> str:
    token = secrets.token_urlsafe(32)
    mongo_db["rsvp_tokens"].update_one(
        {"event_id": event_id, "email": guest_email.lower().strip()},
        {"$set": {
            "event_id":   event_id,
            "email":      guest_email.lower().strip(),
            "token":      token,
            "status":     "pending",
            "created_at": timezone.now(),
            "responded_at": None,
        }},
        upsert=True,
    )
    return token


# ─────────────────────────────────────────────────────────────────────────────
# Invitation emails  (called AFTER payment confirmed)
# ─────────────────────────────────────────────────────────────────────────────

def _send_event_invitations(doc: dict) -> tuple:
    guests = _normalize_emails(doc.get("guest_emails") or [])
    if not guests:
        return 0, None

    event_id        = str(doc.get("_id") or doc.get("id") or "")
    event_name      = (doc.get("event_name") or "Event").strip() or "Event"
    invitation_text = (doc.get("invitation_text") or "You are invited!").strip()
    venue_name      = (doc.get("venue_name") or "").strip()
    event_date      = (doc.get("event_date") or "").strip()
    event_time      = (doc.get("event_time") or "").strip()
    dress_code      = (doc.get("dress_code") or "").strip()
    host_name       = (doc.get("host_name") or "").strip()
    host_contact    = (doc.get("host_contact") or "").strip()
    host_email      = (doc.get("host_email") or "").strip()

    from_email   = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@evently.local")
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")

    sent = 0
    err  = None

    try:
        for guest in guests:
            token       = _generate_rsvp_token(event_id, guest)
            accept_url  = f"{frontend_url}/rsvp/{token}/?response=accepted"
            decline_url = f"{frontend_url}/rsvp/{token}/?response=declined"

            lines = [
                invitation_text, "",
                "── Event details ──",
                f"Event:  {event_name}",
                f"Venue:  {venue_name or '—'}",
                f"Date:   {event_date or '—'}",
                f"Time:   {event_time or '—'}",
            ]
            if dress_code:   lines.append(f"Dress code: {dress_code}")
            if host_name:    lines.append(f"Host: {host_name}")
            if host_contact: lines.append(f"Host contact: {host_contact}")
            if host_email:   lines.append(f"Host email: {host_email}")
            lines += [
                "",
                "── RSVP ──",
                "Will you attend?",
                f"  Yes, I'll be there:  {accept_url}",
                f"  Sorry, can't make it: {decline_url}",
                "",
                "You can change your response anytime by clicking the links above.",
            ]

            send_mail(
                subject=f"You're invited: {event_name}",
                message="\n".join(lines),
                from_email=from_email,
                recipient_list=[guest],
                fail_silently=False,
            )
            sent += 1

    except Exception as e:
        logger.exception("Invitation emails failed: %s", e)
        err_str = str(e)
        if "535" in err_str or "Password not accepted" in err_str or "BadCredentials" in err_str:
            err_str = "Email server authentication failed. Please check the server's email configuration."
        err = err_str

    return sent, err



ESEWA_SECRET       = getattr(settings, "ESEWA_SECRET", "8gBm/:&EnhH.1/q")
ESEWA_PRODUCT_CODE = getattr(settings, "ESEWA_PRODUCT_CODE", "EPAYTEST")


def generate_esewa_signature(total_amount, transaction_uuid, product_code, secret):
    message   = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    signature = hmac.new(
        secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return base64.b64encode(signature).decode()


def _redirect_to_frontend(result: str, reason: str = ""):
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    path = "success" if result == "success" else "failure"
    url  = f"{frontend_url}/payment/{path}/"
    if reason:
        from urllib.parse import urlencode as _ue
        url += "?" + _ue({"reason": reason})
    return HttpResponseRedirect(url)


# ─────────────────────────────────────────────────────────────────────────────
# Auth views
# ─────────────────────────────────────────────────────────────────────────────

class HomeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        mongo_ok = is_mongo_connected()
        return Response({
            "status":  "Evently API is running",
            "mongodb": "connected" if mongo_ok else "disconnected",
        })


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        email = data["email"].lower().strip()

        # OTP gate
        if not cache.get(f"email_verified:{email}"):
            return Response(
                {"detail": "Email not verified. Please verify with OTP first."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"email": ["This email is already registered."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        first_name, last_name = _split_full_name(data.get("full_name", ""))
        username = _username_from_email(email)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=data["password"],
            first_name=first_name,
            last_name=last_name,
        )

        cache.delete(f"email_verified:{email}")

        try:
            mongo_db["user_profiles"].update_one(
                {"user_id": str(user.id)},
                {"$set": {
                    "user_id":    str(user.id),
                    "phone":      data.get("phone", ""),
                    "user_type":  data.get("user_type", ""),
                    "created_at": timezone.now(),
                }},
                upsert=True,
            )
        except Exception as e:
            logger.error("Failed to save user profile to MongoDB: %s", e)

        tokens    = _tokens_for_user(user)
        user_data = {
            "id":         user.id,
            "username":   user.username,
            "email":      user.email,
            "first_name": user.first_name,
            "last_name":  user.last_name,
            "user_type":  data.get("user_type", ""),
            "phone":      data.get("phone", ""),
        }
        return Response({**tokens, "user": user_data}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email    = serializer.validated_data["email"].lower().strip()
        password = serializer.validated_data["password"]

        user = User.objects.filter(email=email).first()
        if not user or not user.check_password(password):
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tokens    = _tokens_for_user(user)
        user_data = {
            "id":         user.id,
            "username":   user.username,
            "email":      user.email,
            "first_name": user.first_name,
            "last_name":  user.last_name,
        }
        try:
            profile = mongo_db["user_profiles"].find_one({"user_id": str(user.id)})
            if profile:
                user_data["user_type"] = profile.get("user_type") or ""
                user_data["phone"]     = profile.get("phone") or ""
        except Exception:
            pass
        return Response({**tokens, "user": user_data}, status=status.HTTP_200_OK)




class SendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        otp = _generate_otp(email)
        try:
            _send_otp_email(email, otp)
        except Exception as e:
            logger.exception("Failed to send OTP email: %s", e)
            return Response(
                {"detail": "Could not send OTP email. Check email configuration."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({"detail": "OTP sent."}, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        otp   = (request.data.get("otp")   or "").strip()
        if not email or not otp:
            return Response({"detail": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        if _verify_otp(email, otp):
            cache.set(f"email_verified:{email}", True, timeout=3600)
            return Response({"valid": True})

        return Response(
            {"valid": False, "detail": "Invalid or expired OTP."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class VenuesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            base      = {"is_active": True, "status": "approved"}
            and_parts = []

            q = (request.query_params.get("q") or "").strip()
            if q:
                regex = {"$regex": q, "$options": "i"}
                and_parts.append({"$or": [{"name": regex}, {"city": regex}, {"event_types": regex}]})

            location = (request.query_params.get("location") or "").strip()
            if location and location.lower() not in ("all", "all locations", ""):
                and_parts.append({"city": {"$regex": location, "$options": "i"}})

            capacity_range = (request.query_params.get("capacity_range") or "").strip().lower()
            if capacity_range and capacity_range != "any":
                if capacity_range == "0-100":
                    and_parts.append({"capacity": {"$lte": 100}})
                elif capacity_range == "100-300":
                    and_parts.append({"capacity": {"$gte": 100, "$lte": 300}})
                elif capacity_range == "300-500":
                    and_parts.append({"capacity": {"$gte": 300, "$lte": 500}})
                elif capacity_range == "500plus":
                    and_parts.append({"capacity": {"$gte": 500}})

            price_range = (request.query_params.get("price_range") or "").strip().lower()
            if price_range and price_range != "any":
                if price_range == "0-50000":
                    and_parts.append({"$or": [{"price": {"$lte": 50000}}, {"price_per_hour": {"$lte": 50000}}]})
                elif price_range == "50000-80000":
                    and_parts.append({"$or": [{"price": {"$gte": 50000, "$lte": 80000}}, {"price_per_hour": {"$gte": 50000, "$lte": 80000}}]})
                elif price_range == "80000plus":
                    and_parts.append({"$or": [{"price": {"$gte": 80000}}, {"price_per_hour": {"$gte": 80000}}]})

            event_type = (request.query_params.get("event_type") or "").strip()
            if event_type:
                and_parts.append({"event_types": event_type})

            if and_parts:
                base["$and"] = and_parts

            venues = list(mongo_db["venues"].find(base))
            return Response([_venue_out(v) for v in venues])
        except Exception:
            return Response([])


class VenueDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            venue = mongo_db["venues"].find_one({"slug": slug, "is_active": True})
        except Exception:
            return Response({"detail": "Venue not found."}, status=status.HTTP_404_NOT_FOUND)
        if not venue:
            return Response({"detail": "Venue not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(_venue_out(venue))


class GeocodeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        if not q or len(q) < 2:
            return Response({"detail": "Query 'q' required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            url = "https://nominatim.openstreetmap.org/search?" + urlencode(
                {"q": q, "format": "json", "limit": "1"}
            )
            req = urllib.request.Request(url, headers={"User-Agent": "EventlyVenueApp/1.0 (Django backend)"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
            if data:
                first = data[0]
                return Response({"lat": float(first["lat"]), "lon": float(first["lon"])})
            return Response({"detail": "No results."}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({"detail": "Geocoding failed."}, status=status.HTTP_502_BAD_GATEWAY)



class OwnerVenuesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            venues = list(mongo_db["venues"].find({"owner_id": str(request.user.id), "is_active": True}))
            return Response([_venue_out(v) for v in venues])
        except Exception:
            return Response([])

    def post(self, request):
        serializer = VenueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            slug = _unique_slug(data["name"])
            doc  = {
                "name":          data["name"],
                "description":   data.get("description") or "",
                "address":       data.get("address") or "",
                "city":          data.get("city") or "",
                "capacity":      data.get("capacity") or 0,
                "price_per_hour": data.get("price_per_hour") or 0.0,
                "price":         data.get("price") if data.get("price") is not None else data.get("price_per_hour"),
                "image_url":     (data.get("image_url") or "").strip() or None,
                "event_types":   data.get("event_types") or [],
                "amenities":     data.get("amenities") or [],
                "slug":          slug,
                "owner_id":      str(request.user.id),
                "images":        [],
                "is_active":     True,
                "status":        "pending",
                "created_at":    timezone.now(),
                "updated_at":    timezone.now(),
            }
            if data.get("latitude")  is not None: doc["latitude"]  = float(data["latitude"])
            if data.get("longitude") is not None: doc["longitude"] = float(data["longitude"])
            doc    = {k: v for k, v in doc.items() if v is not None or k in ("price", "price_per_hour", "capacity")}
            result = mongo_db["venues"].insert_one(doc)
            doc["_id"] = result.inserted_id
            return Response(_venue_out(doc), status=status.HTTP_201_CREATED)
        except Exception:
            return Response(
                {"detail": "MongoDB is not running. Start MongoDB to add venues."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class OwnerVenueDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_own_venue(self, slug, user_id):
        try:
            return mongo_db["venues"].find_one({"slug": slug, "owner_id": str(user_id)})
        except Exception:
            return None

    def get(self, request, slug):
        venue = self._get_own_venue(slug, request.user.id)
        if not venue:
            return Response({"detail": "Venue not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(_venue_out(venue))

    def put(self, request, slug):
        return self.patch(request, slug)

    def patch(self, request, slug):
        venue = self._get_own_venue(slug, request.user.id)
        if not venue:
            return Response({"detail": "Venue not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            serializer = VenueSerializer(data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            updates = {**serializer.validated_data, "updated_at": timezone.now()}
            if "name" in updates:
                updates["slug"] = _unique_slug(updates["name"], existing_id=venue["_id"])
            mongo_db["venues"].update_one({"_id": venue["_id"]}, {"$set": updates})
            updated = mongo_db["venues"].find_one({"_id": venue["_id"]})
            return Response(_venue_out(updated))
        except Exception:
            return Response({"detail": "Could not update. Is MongoDB running?"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    def delete(self, request, slug):
        venue = self._get_own_venue(slug, request.user.id)
        if not venue:
            return Response({"detail": "Venue not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            mongo_db["venues"].update_one(
                {"_id": venue["_id"]},
                {"$set": {"is_active": False, "updated_at": timezone.now()}},
            )
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception:
            return Response({"detail": "Could not delete. Is MongoDB running?"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class VenueImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        slug       = request.data.get("slug") or request.data.get("venue_slug")
        image_file = request.FILES.get("file") or request.FILES.get("image")

        if not image_file:
            return Response(
                {"detail": "A file is required (use 'file' or 'image')."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            data = image_file.read()
            if not data:
                return Response({"detail": "Uploaded file is empty."}, status=status.HTTP_400_BAD_REQUEST)
            img = Image.open(BytesIO(data))
            img.load()
        except Exception:
            return Response(
                {"detail": "Invalid or unsupported image. Use JPEG, PNG or GIF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        elif img.mode != "RGB":
            img = img.convert("RGB")

        max_size = 1200
        w, h = img.size
        if w > max_size or h > max_size:
            if w >= h:
                new_w, new_h = max_size, int(h * max_size / w)
            else:
                new_w, new_h = int(w * max_size / h), max_size
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        filename   = f"{uuid.uuid4().hex}.jpg"
        upload_dir = os.path.join(settings.MEDIA_ROOT, "venue_images")
        os.makedirs(upload_dir, exist_ok=True)
        filepath   = os.path.join(upload_dir, filename)

        try:
            img.save(filepath, "JPEG", quality=85, optimize=True)
        except Exception:
            return Response({"detail": "Failed to save image."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        rel_url   = f"{settings.MEDIA_URL}venue_images/{filename}"
        image_url = request.build_absolute_uri(rel_url) if request else rel_url

        if slug:
            try:
                venue = mongo_db["venues"].find_one({"slug": slug, "owner_id": str(request.user.id)})
                if venue:
                    mongo_db["venues"].update_one(
                        {"_id": venue["_id"]},
                        {
                            "$set":  {"image_url": image_url, "updated_at": timezone.now()},
                            "$push": {"images": image_url},
                        },
                    )
            except Exception:
                pass

        return Response({"image_url": image_url}, status=status.HTTP_201_CREATED)



class CreateVenueEventView(APIView):
    """
    Creates a pending_booking record.
    The booking only moves to `events` after eSewa payment is verified.
    """
    permission_classes = [AllowAny]

    def post(self, request, slug):
        try:
            venue = mongo_db["venues"].find_one({"slug": slug, "is_active": True})
        except Exception:
            return Response({"detail": "Service unavailable."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        if not venue:
            return Response({"detail": "Venue not found."}, status=status.HTTP_404_NOT_FOUND)

        data       = request.data
        event_date = (data.get("event_date") or "").strip()

        # check conflict against confirmed events only
        if event_date:
            try:
                existing = mongo_db["events"].find_one({
                    "venue_slug": slug,
                    "event_date": event_date,
                    "status":     "confirmed",
                })
                if existing:
                    return Response(
                        {"detail": "This venue is already booked for the selected date."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except Exception:
                return Response({"detail": "Service unavailable."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            transaction_uuid = str(uuid.uuid4())
            doc = {
                "venue_slug":              slug,
                "venue_name":              venue.get("name") or "",
                "owner_id":                str(venue.get("owner_id") or ""),
                "event_name":              (data.get("event_name") or "").strip(),
                "event_type":              (data.get("event_type") or "").strip(),
                "event_theme":             (data.get("event_theme") or "").strip(),
                "event_description":       (data.get("event_description") or "").strip(),
                "event_date":              event_date,
                "event_time":              (data.get("event_time") or "").strip(),
                "dress_code":              (data.get("dress_code") or "").strip(),
                "host_name":               (data.get("host_name") or "").strip(),
                "host_contact":            (data.get("host_contact") or "").strip(),
                "host_email":              (data.get("host_email") or "").strip(),
                "expected_guests":         data.get("expected_guests") or 0,
                "additional_requirements": (data.get("additional_requirements") or "").strip(),
                "guest_emails":            list(data.get("guest_emails") or []),
                "invitation_text":         (data.get("invitation_text") or "").strip(),
                "invitation_theme":        (data.get("invitation_theme") or "").strip(),
                "status":                  "pending_payment",
                "transaction_uuid":        transaction_uuid,
                "booker_id":               str(request.user.id) if request.user.is_authenticated else None,
                "created_at":              timezone.now(),
            }
            result = mongo_db["pending_bookings"].insert_one(doc)
            return Response({
                "id":               str(result.inserted_id),
                "transaction_uuid": transaction_uuid,
                "status":           "pending_payment",
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"detail": "Could not save booking. " + str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OwnerEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            events = list(mongo_db["events"].find({"owner_id": str(request.user.id)}))
            events.sort(key=lambda e: (e.get("event_date") or "", e.get("event_time") or ""), reverse=True)
            return Response([_event_out(e) for e in events])
        except Exception:
            return Response([])


class OrganizerEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            events = list(mongo_db["events"].find({"booker_id": str(request.user.id)}))
            events.sort(key=lambda e: (e.get("event_date") or "", e.get("event_time") or ""), reverse=True)
            return Response([_event_out(e) for e in events])
        except Exception:
            return Response([])


@api_view(["POST"])
@permission_classes([AllowAny])
def initiate_esewa_payment(request):
    amount           = str(request.data.get("amount", "0"))
    transaction_uuid = request.data.get("transaction_uuid") or str(uuid.uuid4())

    signature = generate_esewa_signature(
        total_amount=amount,
        transaction_uuid=transaction_uuid,
        product_code=ESEWA_PRODUCT_CODE,
        secret=ESEWA_SECRET,
    )

    backend_url = getattr(settings, "BACKEND_URL", "http://localhost:8000")

    return Response({
        "amount":                   amount,
        "tax_amount":               "0",
        "total_amount":             amount,
        "transaction_uuid":         transaction_uuid,
        "product_code":             ESEWA_PRODUCT_CODE,
        "product_service_charge":   "0",
        "product_delivery_charge":  "0",
        "success_url":              f"{backend_url}/api/esewa/success/",
        "failure_url":              f"{backend_url}/api/esewa/failure/",
        "signed_field_names":       "total_amount,transaction_uuid,product_code",
        "signature":                signature,
        "esewa_url":                "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    })


class EsewaPaymentSuccessView(APIView):
    """
    eSewa GET-redirects here after successful payment.
    Query param: ?data=<base64-encoded JSON>
    Verifies HMAC signature → moves pending_booking → events → sends invites.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        encoded_data = request.query_params.get("data", "")
        if not encoded_data:
            return _redirect_to_frontend("failure", "No payment data received.")

        try:
            decoded      = base64.b64decode(encoded_data).decode("utf-8")
            payment_data = json.loads(decoded)
        except Exception:
            return _redirect_to_frontend("failure", "Invalid payment data.")

        # verify HMAC signature
        signed_fields = payment_data.get("signed_field_names", "").split(",")
        message       = ",".join(f"{f}={payment_data.get(f, '')}" for f in signed_fields)
        expected_sig  = base64.b64encode(
            hmac.new(
                ESEWA_SECRET.encode("utf-8"),
                message.encode("utf-8"),
                hashlib.sha256,
            ).digest()
        ).decode()

        if payment_data.get("signature") != expected_sig:
            return _redirect_to_frontend("failure", "Payment signature mismatch.")

        if payment_data.get("status") != "COMPLETE":
            return _redirect_to_frontend("failure", "Payment not completed.")

        transaction_uuid = payment_data.get("transaction_uuid", "")

        try:
            booking = mongo_db["pending_bookings"].find_one({"transaction_uuid": transaction_uuid})
            if not booking:
                return _redirect_to_frontend("failure", "Booking not found.")

            doc = dict(booking)
            doc.pop("_id", None)
            doc["status"]           = "confirmed"
            doc["payment_status"]   = "paid"
            doc["transaction_code"] = payment_data.get("transaction_code", "")
            doc["transaction_uuid"] = transaction_uuid
            doc["paid_at"]          = timezone.now()

            result   = mongo_db["events"].insert_one(doc)
            doc["_id"] = result.inserted_id

            # send invitations now that payment is confirmed
            guests = _normalize_emails(doc.get("guest_emails") or [])
            if guests:
                _send_event_invitations(doc)

            mongo_db["pending_bookings"].delete_one({"transaction_uuid": transaction_uuid})

            frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
            return HttpResponseRedirect(
                f"{frontend_url}/payment/success/"
                f"?transaction_code={payment_data.get('transaction_code', '')}"
                f"&amount={payment_data.get('total_amount', '')}"
                f"&event_id={str(result.inserted_id)}"
            )

        except Exception as e:
            logger.exception("Error confirming booking: %s", e)
            return _redirect_to_frontend("failure", "Could not confirm booking.")


class EsewaPaymentFailureView(APIView):
    """eSewa redirects here on failure — clean up the pending booking."""
    permission_classes = [AllowAny]

    def get(self, request):
        transaction_uuid = request.query_params.get("transaction_uuid", "")
        if transaction_uuid:
            try:
                mongo_db["pending_bookings"].delete_one({"transaction_uuid": transaction_uuid})
            except Exception:
                pass
        return _redirect_to_frontend("failure")


class RSVPResponseView(APIView):
    """GET /rsvp/<token>/?response=accepted|declined"""
    permission_classes = [AllowAny]

    def get(self, request, token):
        response_value = (request.query_params.get("response") or "").strip().lower()
        if response_value not in ("accepted", "declined"):
            return Response({"detail": "Invalid RSVP response."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            record = mongo_db["rsvp_tokens"].find_one({"token": token})
        except Exception:
            return Response({"detail": "Service unavailable."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        if not record:
            return Response({"detail": "Invalid or expired RSVP link."}, status=status.HTTP_404_NOT_FOUND)

        try:
            mongo_db["rsvp_tokens"].update_one(
                {"token": token},
                {"$set": {"status": response_value, "responded_at": timezone.now()}},
            )

            # update summary counts on the event document
            event_id  = record.get("event_id")
            all_rsvps = list(mongo_db["rsvp_tokens"].find({"event_id": event_id}))
            mongo_db["events"].update_one(
                {"_id": ObjectId(event_id)},
                {"$set": {
                    "rsvp_accepted": sum(1 for r in all_rsvps if r.get("status") == "accepted"),
                    "rsvp_declined": sum(1 for r in all_rsvps if r.get("status") == "declined"),
                    "rsvp_pending":  sum(1 for r in all_rsvps if r.get("status") == "pending"),
                }},
            )

            event_name = ""
            try:
                ev = mongo_db["events"].find_one({"_id": ObjectId(event_id)})
                if ev:
                    event_name = ev.get("event_name", "")
            except Exception:
                pass

            return Response({
                "status":     response_value,
                "event_name": event_name,
                "email":      record.get("email"),
            })

        except Exception as e:
            logger.exception("RSVP update failed: %s", e)
            return Response({"detail": "Could not save response."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EventRSVPDetailView(APIView):
    """GET /organizer/events/<event_id>/rsvp/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        try:
            event = mongo_db["events"].find_one({
                "_id":       ObjectId(event_id),
                "booker_id": str(request.user.id),
            })
        except Exception:
            return Response({"detail": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

        if not event:
            return Response({"detail": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            rsvps  = list(mongo_db["rsvp_tokens"].find({"event_id": event_id}))
            guests = [
                {
                    "email":        r.get("email"),
                    "status":       r.get("status", "pending"),
                    "responded_at": str(r.get("responded_at") or ""),
                }
                for r in rsvps
            ]
            return Response({
                "event_id":   event_id,
                "event_name": event.get("event_name", ""),
                "total":      len(guests),
                "accepted":   sum(1 for g in guests if g["status"] == "accepted"),
                "declined":   sum(1 for g in guests if g["status"] == "declined"),
                "pending":    sum(1 for g in guests if g["status"] == "pending"),
                "guests":     guests,
            })
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminVenueOwnersView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        try:
            profiles = list(mongo_db["user_profiles"].find({"user_type": "venue_owner"}))
            result   = []
            for p in profiles:
                user_id = p.get("user_id")
                try:
                    django_user = User.objects.get(id=user_id)
                    venue_count = mongo_db["venues"].count_documents({"owner_id": str(user_id), "is_active": True})
                    result.append({
                        "id":     str(user_id),
                        "name":   f"{django_user.first_name} {django_user.last_name}".strip() or django_user.username,
                        "email":  django_user.email,
                        "joined": str(django_user.date_joined.date()),
                        "venues": venue_count,
                        "status": p.get("account_status") or "active",
                        "phone":  p.get("phone") or "",
                    })
                except User.DoesNotExist:
                    continue
            return Response(result)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminVenueOwnerDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, user_id):
        action = request.data.get("action")
        if action not in ("suspend", "activate"):
            return Response({"detail": "action must be 'suspend' or 'activate'."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            new_status = "suspended" if action == "suspend" else "active"
            mongo_db["user_profiles"].update_one(
                {"user_id": str(user_id)},
                {"$set": {"account_status": new_status}},
            )
            return Response({"status": new_status})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, user_id):
        try:
            User.objects.filter(id=user_id).delete()
            mongo_db["user_profiles"].delete_one({"user_id": str(user_id)})
            mongo_db["venues"].update_many({"owner_id": str(user_id)}, {"$set": {"is_active": False}})
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminVenuesView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        try:
            venues = list(mongo_db["venues"].find({"is_active": True}))
            result = []
            for v in venues:
                try:
                    owner      = User.objects.get(id=v.get("owner_id"))
                    owner_name = f"{owner.first_name} {owner.last_name}".strip() or owner.username
                except Exception:
                    owner_name = v.get("owner_id") or "Unknown"
                v_out              = _venue_out(dict(v))
                v_out["owner_name"] = owner_name
                result.append(v_out)
            return Response(result)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminVenueDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, venue_id):
        action = request.data.get("action")
        if action not in ("approve", "reject"):
            return Response({"detail": "action must be 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            new_status = "approved" if action == "approve" else "rejected"
            mongo_db["venues"].update_one(
                {"_id": ObjectId(venue_id)},
                {"$set": {"status": new_status, "updated_at": timezone.now()}},
            )
            return Response({"status": new_status})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, venue_id):
        try:
            mongo_db["venues"].update_one(
                {"_id": ObjectId(venue_id)},
                {"$set": {"is_active": False, "updated_at": timezone.now()}},
            )
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        try:
            return Response({
                "total_owners":    mongo_db["user_profiles"].count_documents({"user_type": "venue_owner"}),
                "total_venues":    mongo_db["venues"].count_documents({"is_active": True}),
                "pending_venues":  mongo_db["venues"].count_documents({"is_active": True, "status": "pending"}),
                "total_bookings":  mongo_db["events"].count_documents({}),
            })
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)