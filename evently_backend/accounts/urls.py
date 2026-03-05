from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    RegisterView,
    HomeView,
    VenuesView,
    VenueDetailView,
    GeocodeView,
    OwnerVenuesView,
    OwnerVenueDetailView,
    VenueImageUploadView,
    CreateVenueEventView,
    OwnerEventsView,
    OrganizerEventsView,
)

urlpatterns = [
    path("", HomeView.as_view(), name="home"),
    path("accounts/register/", RegisterView.as_view(), name="register"),
    path("accounts/login/", LoginView.as_view(), name="login"),
    path("accounts/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("venues/", VenuesView.as_view(), name="venues"),
    path("venues/<slug:slug>/", VenueDetailView.as_view(), name="venue-detail"),
    path("venues/<slug:slug>/events/", CreateVenueEventView.as_view(), name="venue-events"),
    path("geocode/", GeocodeView.as_view(), name="geocode"),
    path("owner/venues/", OwnerVenuesView.as_view(), name="owner-venues"),
    path("owner/venues/<slug:slug>/", OwnerVenueDetailView.as_view(), name="owner-venue-detail"),
    path("owner/venues/upload-image/", VenueImageUploadView.as_view(), name="owner-venue-upload-image"),
    path("owner/events/", OwnerEventsView.as_view(), name="owner-events"),
    path("organizer/events/", OrganizerEventsView.as_view(), name="organizer-events"),
]