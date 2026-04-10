from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    RegisterView,
    HomeView,
    SendOTPView,
    VerifyOTPView,
    VenuesView,
    VenueDetailView,
    GeocodeView,
    OwnerVenuesView,
    OwnerVenueDetailView,
    VenueImageUploadView,
    CreateVenueEventView,
    OwnerEventsView,
    OwnerEventDetailView,
    OrganizerEventsView,
    AdminVenueOwnersView,
    AdminVenueOwnerDetailView,
    AdminVenuesView,
    AdminVenueDetailView,
    AdminStatsView,
    initiate_esewa_payment,
    EsewaPaymentSuccessView,
    EsewaPaymentFailureView,
    RSVPResponseView,
    EventRSVPDetailView,
<<<<<<< HEAD
    AdminUsersView,
     AdminUserDetailView,
     OwnerNotificationsView,
     OwnerNotificationsMarkReadView
=======
<<<<<<< HEAD
    AdminUsersView,
     AdminUserDetailView,
=======
<<<<<<< HEAD
>>>>>>> f127d7fe71f4bae8d4cc62914fc39ab9bade4baa
>>>>>>> e6d55850870d78c9665dbded260ac7f635f38d90

)
from django.http import HttpResponseRedirect
from django.urls import path


from django.urls import path
from . import views

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
=======
)
from django.http import HttpResponseRedirect
from django.urls import path
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
>>>>>>> f127d7fe71f4bae8d4cc62914fc39ab9bade4baa
>>>>>>> e6d55850870d78c9665dbded260ac7f635f38d90
urlpatterns = [
    path("", HomeView.as_view(), name="home"),
    path("accounts/register/",          RegisterView.as_view(),       name="register"),
    path("accounts/login/",             LoginView.as_view(),           name="login"),
    path("accounts/token/refresh/",     TokenRefreshView.as_view(),    name="token-refresh"),
    path("accounts/send-otp/",          SendOTPView.as_view(),         name="send-otp"),
    path("accounts/verify-otp/",        VerifyOTPView.as_view(),       name="verify-otp"),
    path("venues/",                     VenuesView.as_view(),          name="venues"),
    path("venues/<slug:slug>/",         VenueDetailView.as_view(),     name="venue-detail"),
    path("venues/<slug:slug>/events/",  CreateVenueEventView.as_view(),name="venue-events"),
    path("geocode/",                    GeocodeView.as_view(),         name="geocode"),
    path("owner/venues/",                        OwnerVenuesView.as_view(),       name="owner-venues"),
    path("owner/venues/upload-image/",           VenueImageUploadView.as_view(),  name="owner-venue-upload-image"),
    path("owner/venues/<slug:slug>/",            OwnerVenueDetailView.as_view(),  name="owner-venue-detail"),
    path("owner/events/",                        OwnerEventsView.as_view(),       name="owner-events"),
    path("owner/events/<str:event_id>/",         OwnerEventDetailView.as_view(),  name="owner-event-detail"),

   
    path("organizer/events/",                          OrganizerEventsView.as_view(),  name="organizer-events"),
    path("organizer/events/<str:event_id>/rsvp/",      EventRSVPDetailView.as_view(),  name="event-rsvp-detail"),

    path("rsvp/<str:token>/",           RSVPResponseView.as_view(),    name="rsvp-response"),

    
    path("initiate-esewa-payment/",     initiate_esewa_payment,        name="initiate-esewa-payment"),
    path("esewa/success/",              EsewaPaymentSuccessView.as_view(), name="esewa-success"),
    path("esewa/failure/",              EsewaPaymentFailureView.as_view(), name="esewa-failure"),

    path("admin-api/stats/",                      AdminStatsView.as_view(),            name="admin-stats"),
    path("admin-api/owners/",                     AdminVenueOwnersView.as_view(),      name="admin-owners"),
    path("admin-api/owners/<str:user_id>/",       AdminVenueOwnerDetailView.as_view(), name="admin-owner-detail"),
    path("admin-api/venues/",                     AdminVenuesView.as_view(),           name="admin-venues"),
    path("admin-api/venues/<str:venue_id>/",      AdminVenueDetailView.as_view(),      name="admin-venue-detail"),

path("payment/failure/", lambda request: HttpResponseRedirect(
    "http://localhost:5173/payment/failure/?" + request.META.get("QUERY_STRING", "")
), name="payment-failure-passthrough"),

path("payment/success/", lambda request: HttpResponseRedirect(
    "http://localhost:5173/payment/success/?" + request.META.get("QUERY_STRING", "")
), name="payment-success-passthrough"),
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> f127d7fe71f4bae8d4cc62914fc39ab9bade4baa
>>>>>>> e6d55850870d78c9665dbded260ac7f635f38d90

    path('venues/',                                   views.VenuesView.as_view()),
    path('venues/<slug:slug>/',                       views.VenueDetailView.as_view()),
    path('venues/<slug:slug>/events/',                views.CreateVenueEventView.as_view()),


    path('venues/<slug:slug>/reviews/',               views.VenueReviewsView.as_view()),
    path('venues/<slug:slug>/reviews/<str:review_id>/', views.VenueReviewDeleteView.as_view()),
<<<<<<< HEAD
    path("admin-api/users/",              AdminUsersView.as_view(),      name="admin-users"),
    path("admin-api/users/<str:user_id>/", AdminUserDetailView.as_view(), name="admin-user-detail"),

    path("owner/notifications/",           OwnerNotificationsView.as_view(),        name="owner-notifications"),
path("owner/notifications/mark-read/", OwnerNotificationsMarkReadView.as_view(),name="owner-notifications-mark-read"),

=======
<<<<<<< HEAD
    path("admin-api/users/",              AdminUsersView.as_view(),      name="admin-users"),
    path("admin-api/users/<str:user_id>/", AdminUserDetailView.as_view(), name="admin-user-detail"),

=======

=======
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
>>>>>>> f127d7fe71f4bae8d4cc62914fc39ab9bade4baa
>>>>>>> e6d55850870d78c9665dbded260ac7f635f38d90
]



<<<<<<< HEAD

=======
<<<<<<< HEAD

=======
<<<<<<< HEAD

=======
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
>>>>>>> f127d7fe71f4bae8d4cc62914fc39ab9bade4baa
>>>>>>> e6d55850870d78c9665dbded260ac7f635f38d90
