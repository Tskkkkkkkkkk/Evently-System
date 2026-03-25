from rest_framework import serializers

ALLOWED_USER_TYPES = {"event_organizer", "venue_owner"}

class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField()
    phone = serializers.CharField(required=False, allow_blank=True)
    user_type = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate_user_type(self, value):
        if value and value.lower() not in ALLOWED_USER_TYPES:
            raise serializers.ValidationError(
                "Invalid user type. Must be 'event_organizer' or 'venue_owner'."
            )
        return value.lower() if value else value

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class VenueSerializer(serializers.Serializer):
    name = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    capacity = serializers.IntegerField(required=False, default=0)
    price_per_hour = serializers.FloatField(required=False, default=0.0)
    price = serializers.FloatField(required=False, allow_null=True)
    image_url = serializers.CharField(required=False, allow_blank=True)
    event_types = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    amenities = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)