from rest_framework.permissions import BasePermission
from evently_backend.mongo_client import mongo_db

class IsAdmin(BasePermission): 
    """Allows access only to users whose MongoDB profile has user_type == 'admin'."""
    message = "You do not have admin privileges."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            profile = mongo_db["user_profiles"].find_one({"user_id": str(request.user.id)})
            if profile:
                return (profile.get("user_type") or "").lower() == "admin"
        except Exception:
            return False
        return False