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
<<<<<<< HEAD

    AdminVenueOwnersView,
    AdminVenueOwnerDetailView,
    AdminVenuesView,
    AdminVenueDetailView,
    AdminStatsView,
=======
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
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
<<<<<<< HEAD
    path("owner/venues/upload-image/", VenueImageUploadView.as_view(), name="owner-venue-upload-image"),
    path("owner/venues/<slug:slug>/", OwnerVenueDetailView.as_view(), name="owner-venue-detail"),
    path("owner/events/", OwnerEventsView.as_view(), name="owner-events"),
    path("organizer/events/", OrganizerEventsView.as_view(), name="organizer-events"),

   
    path("admin-api/stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("admin-api/owners/", AdminVenueOwnersView.as_view(), name="admin-owners"),
    path("admin-api/owners/<str:user_id>/", AdminVenueOwnerDetailView.as_view(), name="admin-owner-detail"),
    path("admin-api/venues/", AdminVenuesView.as_view(), name="admin-venues"),
    path("admin-api/venues/<str:venue_id>/", AdminVenueDetailView.as_view(), name="admin-venue-detail"),
=======
    path("owner/venues/<slug:slug>/", OwnerVenueDetailView.as_view(), name="owner-venue-detail"),
    path("owner/venues/upload-image/", VenueImageUploadView.as_view(), name="owner-venue-upload-image"),
    path("owner/events/", OwnerEventsView.as_view(), name="owner-events"),
    path("organizer/events/", OrganizerEventsView.as_view(), name="organizer-events"),
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
]