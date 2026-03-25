import json
import logging
import os
import re
import uuid
import urllib.request
from io import BytesIO
from urllib.parse import urlencode
from django.contrib.auth import get_user_model
from PIL import Image

logger = logging.getLogger(__name__)
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from slugify import slugify
from evently_backend.mongo_client import mongo_db, is_mongo_connected
from .serializers import LoginSerializer, RegisterSerializer, VenueSerializer
<<<<<<< HEAD
from .permissions import IsAdmin
=======
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab

User = get_user_model()


<<<<<<< HEAD
=======
# ── helpers ──────────────────────────────────────────────────────────────────
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab

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
<<<<<<< HEAD
=======
    """Serialize a MongoDB venue document for API output."""
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
    if doc is None:
        return {}
    doc["id"] = str(doc.pop("_id", ""))
    return doc


def _event_out(doc: dict) -> dict:
<<<<<<< HEAD
=======
    """Serialize a MongoDB event document for API output."""
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
    if doc is None:
        return {}
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id", ""))
    return doc


def _normalize_emails(emails) -> list:
<<<<<<< HEAD
=======
    """Return list of valid, normalized email addresses."""
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
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


def _send_event_invitations(doc: dict) -> tuple:
<<<<<<< HEAD
=======
    """
    Send invitation emails to guest_emails with event details.
    Returns (sent_count, error_message or None).
    """
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
    guests = _normalize_emails(doc.get("guest_emails") or [])
    if not guests:
        return 0, None

    event_name = (doc.get("event_name") or "Event").strip() or "Event"
    invitation_text = (doc.get("invitation_text") or "You are invited!").strip()
    venue_name = (doc.get("venue_name") or "").strip()
    event_date = (doc.get("event_date") or "").strip()
    event_time = (doc.get("event_time") or "").strip()
    dress_code = (doc.get("dress_code") or "").strip()
    host_name = (doc.get("host_name") or "").strip()
    host_contact = (doc.get("host_contact") or "").strip()
    host_email = (doc.get("host_email") or "").strip()

    lines = [
        invitation_text,
        "",
        "── Event details ──",
        f"Event: {event_name}",
        f"Venue: {venue_name or '—'}",
        f"Date:  {event_date or '—'}",
        f"Time:  {event_time or '—'}",
    ]
    if dress_code:
        lines.append(f"Dress code: {dress_code}")
    if host_name:
        lines.append(f"Host: {host_name}")
    if host_contact:
        lines.append(f"Host contact: {host_contact}")
    if host_email:
        lines.append(f"Host email: {host_email}")
    body = "\n".join(lines)

    subject = f"You're invited: {event_name}"
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@evently.local")

    try:
        sent = 0
        for to in guests:
            send_mail(
                subject=subject,
                message=body,
                from_email=from_email,
                recipient_list=[to],
                fail_silently=False,
            )
            sent += 1
        return sent, None
    except Exception as e:
        logger.exception("Invitation emails failed: %s", e)
        err_str = str(e)
<<<<<<< HEAD
        if "535" in err_str or "Password not accepted" in err_str or "BadCredentials" in err_str:
            err_str = "Email server authentication failed. Please check the server's email configuration."
        return sent, err_str


=======
        # Don't expose raw SMTP/auth errors to the client
        if "535" in err_str or "Password not accepted" in err_str or "BadCredentials" in err_str:
            err_str = "Email server authentication failed. Please check the server's email configuration (e.g. Gmail App Password)."
        return sent, err_str


# ── auth views ───────────────────────────────────────────────────────────────
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab

class HomeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        mongo_ok = is_mongo_connected()
        return Response({
<<<<<<< HEAD
            "status": "Evently API is running",
=======
            "status": "Evently API is running 🎉",
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
            "mongodb": "connected" if mongo_ok else "disconnected",
        })


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        email = data["email"].lower().strip()
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

        try:
            mongo_db["user_profiles"].update_one(
                {"user_id": str(user.id)},
                {
                    "$set": {
                        "user_id": str(user.id),
                        "phone": data.get("phone", ""),
                        "user_type": data.get("user_type", ""),
                        "created_at": timezone.now(),
                    }
                },
                upsert=True,
            )
<<<<<<< HEAD
        except Exception as e:
            logger.error("Failed to save user profile to MongoDB: %s", e)

        tokens = _tokens_for_user(user)
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "user_type": data.get("user_type", ""),
            "phone": data.get("phone", ""),
        }
        return Response(
            {**tokens, "user": user_data},
=======
        except Exception:
            pass

        tokens = _tokens_for_user(user)
        return Response(
            {
                **tokens,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
            },
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower().strip()
        password = serializer.validated_data["password"]

<<<<<<< HEAD
        user = User.objects.filter(email=email).first()
        if not user or not user.check_password(password):
=======
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(password):
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tokens = _tokens_for_user(user)
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
        try:
            profile = mongo_db["user_profiles"].find_one({"user_id": str(user.id)})
            if profile:
                user_data["user_type"] = profile.get("user_type") or ""
                user_data["phone"] = profile.get("phone") or ""
        except Exception:
            pass
        return Response({**tokens, "user": user_data}, status=status.HTTP_200_OK)


<<<<<<< HEAD

=======
# ── public venue views ────────────────────────────────────────────────────────
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab

class VenuesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
<<<<<<< HEAD
            base = {"is_active": True, "status": "approved"}
=======
            base = {"is_active": True}
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
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
<<<<<<< HEAD
=======
    """GET ?q=address, city, Nepal - returns { lat, lon } from Nominatim (for venue map)."""
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
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
            if data and len(data) > 0:
                first = data[0]
                return Response({"lat": float(first["lat"]), "lon": float(first["lon"])})
            return Response({"detail": "No results."}, status=status.HTTP_404_NOT_FOUND)
<<<<<<< HEAD
        except Exception:
            return Response({"detail": "Geocoding failed."}, status=status.HTTP_502_BAD_GATEWAY)


=======
        except Exception as e:
            return Response({"detail": "Geocoding failed."}, status=status.HTTP_502_BAD_GATEWAY)


# ── owner venue views (authenticated) ────────────────────────────────────────
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab

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
            doc = {
                "name": data["name"],
                "description": data.get("description") or "",
                "address": data.get("address") or "",
                "city": data.get("city") or "",
                "capacity": data.get("capacity") or 0,
                "price_per_hour": data.get("price_per_hour") or 0.0,
                "price": data.get("price") if data.get("price") is not None else data.get("price_per_hour"),
                "image_url": (data.get("image_url") or "").strip() or None,
                "event_types": data.get("event_types") or [],
                "amenities": data.get("amenities") or [],
                "slug": slug,
                "owner_id": str(request.user.id),
                "images": [],
                "is_active": True,
<<<<<<< HEAD
                "status": "pending",
=======
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
                "created_at": timezone.now(),
                "updated_at": timezone.now(),
            }
            if data.get("latitude") is not None:
                doc["latitude"] = float(data["latitude"])
            if data.get("longitude") is not None:
                doc["longitude"] = float(data["longitude"])
            doc = {k: v for k, v in doc.items() if v is not None or k in ("price", "price_per_hour", "capacity")}
            result = mongo_db["venues"].insert_one(doc)
            doc["_id"] = result.inserted_id
            return Response(_venue_out(doc), status=status.HTTP_201_CREATED)
<<<<<<< HEAD
        except Exception:
            return Response(
                {"detail": "MongoDB is not running. Start MongoDB to add venues."},
=======
        except Exception as e:
            return Response(
                {"detail": "MongoDB is not running. Start MongoDB to add venues. (Run: mongod --dbpath <path>)"},
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
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
                {"_id": venue["_id"]}, {"$set": {"is_active": False, "updated_at": timezone.now()}}
            )
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception:
            return Response({"detail": "Could not delete. Is MongoDB running?"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class VenueImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        slug = request.data.get("slug") or request.data.get("venue_slug")
        image_file = request.FILES.get("file") or request.FILES.get("image")

        if not image_file:
            return Response(
                {"detail": "A file is required (use 'file' or 'image')."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            data = image_file.read()
            if not data:
<<<<<<< HEAD
                return Response({"detail": "Uploaded file is empty."}, status=status.HTTP_400_BAD_REQUEST)
            img = Image.open(BytesIO(data))
            img.load()
        except Exception:
=======
                return Response(
                    {"detail": "Uploaded file is empty."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            img = Image.open(BytesIO(data))
            img.load()
        except Exception as e:
            logger.warning("Venue image upload: invalid image file: %s", e)
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
            return Response(
                {"detail": "Invalid or unsupported image. Use JPEG, PNG or GIF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

<<<<<<< HEAD
=======
        # Convert to RGB for JPEG (e.g. PNG with transparency -> JPEG)
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        elif img.mode != "RGB":
            img = img.convert("RGB")

<<<<<<< HEAD
=======
        # Optional: resize if very large (max 1200px on longest side)
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
        max_size = 1200
        w, h = img.size
        if w > max_size or h > max_size:
            if w >= h:
                new_w, new_h = max_size, int(h * max_size / w)
            else:
                new_w, new_h = int(w * max_size / h), max_size
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        filename = f"{uuid.uuid4().hex}.jpg"
        upload_dir = os.path.join(settings.MEDIA_ROOT, "venue_images")
        os.makedirs(upload_dir, exist_ok=True)
        filepath = os.path.join(upload_dir, filename)

        try:
            img.save(filepath, "JPEG", quality=85, optimize=True)
<<<<<<< HEAD
        except Exception:
            return Response({"detail": "Failed to save image."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
=======
        except Exception as e:
            logger.exception("Venue image save failed: %s", e)
            return Response(
                {"detail": "Failed to save image."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab

        rel_url = f"{settings.MEDIA_URL}venue_images/{filename}"
        image_url = request.build_absolute_uri(rel_url) if request else rel_url

        if slug:
            try:
                venue = mongo_db["venues"].find_one({"slug": slug, "owner_id": str(request.user.id)})
                if venue:
                    mongo_db["venues"].update_one(
                        {"_id": venue["_id"]},
                        {"$set": {"image_url": image_url, "updated_at": timezone.now()}, "$push": {"images": image_url}},
                    )
            except Exception:
                pass

        return Response({"image_url": image_url}, status=status.HTTP_201_CREATED)


<<<<<<< HEAD


class CreateVenueEventView(APIView):
=======
# ── venue events (bookings / host an event) ───────────────────────────────────

class CreateVenueEventView(APIView):
    """POST: Create an event/booking for a venue. Data appears on venue owner dashboard."""
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
    permission_classes = [AllowAny]

    def post(self, request, slug):
        try:
            venue = mongo_db["venues"].find_one({"slug": slug, "is_active": True})
        except Exception:
            return Response({"detail": "Service unavailable."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        if not venue:
            return Response({"detail": "Venue not found."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        event_date = (data.get("event_date") or "").strip()
        if event_date:
            try:
<<<<<<< HEAD
                existing = mongo_db["events"].find_one({"venue_slug": slug, "event_date": event_date})
                if existing:
                    return Response(
                        {"detail": "This venue is already booked for the selected date."},
=======
                existing = mongo_db["events"].find_one({
                    "venue_slug": slug,
                    "event_date": event_date,
                })
                if existing:
                    return Response(
                        {"detail": "This venue is already booked for the selected date. Please choose another date."},
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except Exception:
                return Response({"detail": "Service unavailable."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            doc = {
                "venue_slug": slug,
                "venue_name": venue.get("name") or "",
                "owner_id": str(venue.get("owner_id") or ""),
                "event_name": (data.get("event_name") or "").strip(),
                "event_type": (data.get("event_type") or "").strip(),
                "event_theme": (data.get("event_theme") or "").strip(),
                "event_description": (data.get("event_description") or "").strip(),
                "event_date": (data.get("event_date") or "").strip(),
                "event_time": (data.get("event_time") or "").strip(),
                "dress_code": (data.get("dress_code") or "").strip(),
                "host_name": (data.get("host_name") or "").strip(),
                "host_contact": (data.get("host_contact") or "").strip(),
                "host_email": (data.get("host_email") or "").strip(),
                "expected_guests": data.get("expected_guests") or 0,
                "additional_requirements": (data.get("additional_requirements") or "").strip(),
                "guest_emails": list(data.get("guest_emails") or []),
                "invitation_text": (data.get("invitation_text") or "").strip(),
                "invitation_theme": (data.get("invitation_theme") or "").strip(),
                "status": "pending",
                "created_at": timezone.now(),
                "booker_id": str(request.user.id) if request.user.is_authenticated else None,
            }
            result = mongo_db["events"].insert_one(doc)
            doc["_id"] = result.inserted_id

<<<<<<< HEAD
=======
            # Send invitation emails to guests if any
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
            response_data = _event_out(doc)
            guests = _normalize_emails(doc.get("guest_emails") or [])
            if guests:
                sent, err = _send_event_invitations(doc)
                response_data["invitations_sent"] = sent
                if err:
                    response_data["invitation_error"] = err
<<<<<<< HEAD

            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": "Could not save event. " + str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OwnerEventsView(APIView):
=======
                    logger.warning("Invitation send failed (event created): %s", err)

            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"detail": "Could not save event. " + str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class OwnerEventsView(APIView):
    """GET: List events for venues owned by the current user (venue owner dashboard)."""
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            events = list(mongo_db["events"].find({"owner_id": str(request.user.id)}))
            events.sort(key=lambda e: (e.get("event_date") or "", e.get("event_time") or ""), reverse=True)
            return Response([_event_out(e) for e in events])
        except Exception:
            return Response([])


class OrganizerEventsView(APIView):
<<<<<<< HEAD
=======
    """GET: List events created by the current user (event organizer dashboard)."""
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            events = list(mongo_db["events"].find({"booker_id": str(request.user.id)}))
            events.sort(key=lambda e: (e.get("event_date") or "", e.get("event_time") or ""), reverse=True)
            return Response([_event_out(e) for e in events])
        except Exception:
<<<<<<< HEAD
            return Response([])



class AdminVenueOwnersView(APIView):
    """GET: List all venue owners."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        try:
            profiles = list(mongo_db["user_profiles"].find({"user_type": "venue_owner"}))
            result = []
            for p in profiles:
                user_id = p.get("user_id")
                try:
                    django_user = User.objects.get(id=user_id)
                    venue_count = mongo_db["venues"].count_documents({"owner_id": str(user_id), "is_active": True})
                    result.append({
                        "id": str(user_id),
                        "name": f"{django_user.first_name} {django_user.last_name}".strip() or django_user.username,
                        "email": django_user.email,
                        "joined": str(django_user.date_joined.date()),
                        "venues": venue_count,
                        "status": p.get("account_status") or "active",
                        "phone": p.get("phone") or "",
                    })
                except User.DoesNotExist:
                    continue
            return Response(result)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminVenueOwnerDetailView(APIView):
    """PATCH: suspend/activate owner. DELETE: remove owner."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, user_id):
        action = request.data.get("action")
        if action not in ("suspend", "activate"):
            return Response({"detail": "action must be 'suspend' or 'activate'."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            new_status = "suspended" if action == "suspend" else "active"
            mongo_db["user_profiles"].update_one(
                {"user_id": str(user_id)},
                {"$set": {"account_status": new_status}}
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
    """GET: List all venues (all owners)."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        try:
            venues = list(mongo_db["venues"].find({"is_active": True}))
            result = []
            for v in venues:
                try:
                    owner = User.objects.get(id=v.get("owner_id"))
                    owner_name = f"{owner.first_name} {owner.last_name}".strip() or owner.username
                except Exception:
                    owner_name = v.get("owner_id") or "Unknown"
                v_out = _venue_out(dict(v))
                v_out["owner_name"] = owner_name
                result.append(v_out)
            return Response(result)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminVenueDetailView(APIView):
    """PATCH: approve/reject venue. DELETE: remove venue."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, venue_id):
        action = request.data.get("action")
        if action not in ("approve", "reject"):
            return Response({"detail": "action must be 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from bson import ObjectId
            new_status = "approved" if action == "approve" else "rejected"
            mongo_db["venues"].update_one(
                {"_id": ObjectId(venue_id)},
                {"$set": {"status": new_status, "updated_at": timezone.now()}}
            )
            return Response({"status": new_status})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, venue_id):
        try:
            from bson import ObjectId
            mongo_db["venues"].update_one(
                {"_id": ObjectId(venue_id)},
                {"$set": {"is_active": False, "updated_at": timezone.now()}}
            )
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminStatsView(APIView):
    """GET: Dashboard stats."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        try:
            total_owners = mongo_db["user_profiles"].count_documents({"user_type": "venue_owner"})
            total_venues = mongo_db["venues"].count_documents({"is_active": True})
            pending_venues = mongo_db["venues"].count_documents({"is_active": True, "status": "pending"})
            total_bookings = mongo_db["events"].count_documents({})
            return Response({
                "total_owners": total_owners,
                "total_venues": total_venues,
                "pending_venues": pending_venues,
                "total_bookings": total_bookings,
            })
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
=======
            return Response([])
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
