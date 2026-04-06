import logging
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model

from evently_backend.mongo_client import mongo_db


logger = logging.getLogger(__name__)

User = get_user_model()


class Command(BaseCommand):

    help = 'Sends reminder emails for events happening exactly 7 days from today'

    def handle(self, *args, **options):
      
        target_date = date.today() + timedelta(days=7)

        target_date_str = target_date.strftime('%Y-%m-%d')

        self.stdout.write(f'Looking for events on {target_date_str}…')

       
        try:
            events = list(mongo_db['events'].find({
                'event_date': target_date_str,
                'status':     'confirmed', 
            }))
        except Exception as e:
        
            logger.error('Could not query MongoDB: %s', e)
            self.stderr.write(f'MongoDB error: {e}')
            return

        if not events:
            self.stdout.write('No events found for that date. Nothing to send.')
            return

        self.stdout.write(f'Found {len(events)} event(s). Sending reminders…')

       
        sent_count  = 0
        error_count = 0

        for event in events:
            event_name  = (event.get('event_name') or 'Your Event').strip() or 'Your Event'
            venue_name  = (event.get('venue_name') or '').strip()
            event_date  = (event.get('event_date') or '').strip()
            event_time  = (event.get('event_time') or '').strip()
            host_name   = (event.get('host_name')  or '').strip()
            dress_code  = (event.get('dress_code') or '').strip()
            booker_id   = event.get('booker_id')

      L
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@evently.local')

          
            if booker_id:
                try:
                   
                    organizer = User.objects.get(id=booker_id)
                    organizer_email = organizer.email

                    
                    organizer_message = _build_organizer_reminder(
                        organizer_name=organizer.first_name or organizer.username,
                        event_name=event_name,
                        venue_name=venue_name,
                        event_date=event_date,
                        event_time=event_time,
                        dress_code=dress_code,
                        guest_count=len(event.get('guest_emails') or []),
                        expected_guests=event.get('expected_guests') or 0,
                    )

                    send_mail(
                        subject=f'Reminder: {event_name} is in 7 days',
                        message=organizer_message,
                        from_email=from_email,
                        recipient_list=[organizer_email],
                        fail_silently=False,
                    )
                    sent_count += 1
                    self.stdout.write(f'  Organizer reminder sent to {organizer_email}')

                except User.DoesNotExist:
                    
                    logger.warning('Organizer user id=%s not found, skipping.', booker_id)
                except Exception as e:
                    logger.exception('Failed to send organizer reminder for event %s: %s', event_name, e)
                    error_count += 1

           
            guest_emails = event.get('guest_emails') or []
            for guest_email in guest_emails:
                if not guest_email or '@' not in guest_email:
                    continue 

                try:
                    guest_message = _build_guest_reminder(
                        event_name=event_name,
                        venue_name=venue_name,
                        event_date=event_date,
                        event_time=event_time,
                        host_name=host_name,
                        dress_code=dress_code,
                    )

                    send_mail(
                        subject=f'Reminder: {event_name} is coming up in 7 days',
                        message=guest_message,
                        from_email=from_email,
                        recipient_list=[guest_email],
                        fail_silently=False,
                    )
                    sent_count += 1
                    self.stdout.write(f'  Guest reminder sent to {guest_email}')

                except Exception as e:
                    logger.exception('Failed to send guest reminder to %s: %s', guest_email, e)
                    error_count += 1

        
        self.stdout.write(
            self.style.SUCCESS(
                f'Done. {sent_count} email(s) sent, {error_count} failed.'
            )
        )


def _build_organizer_reminder(
    organizer_name, event_name, venue_name,
    event_date, event_time, dress_code,
    guest_count, expected_guests,
):
  
    lines = [
        f'Hi {organizer_name},',
        '',
        f'Just a reminder that your event is coming up in 7 days!',
        '',
        '── Your event details ──────────────────────',
        f'Event:    {event_name}',
        f'Venue:    {venue_name or "—"}',
        f'Date:     {event_date or "—"}',
        f'Time:     {event_time or "—"}',
    ]

  
    if dress_code:
        lines.append(f'Dress code: {dress_code}')

    lines += [
        '',
        '── Guest summary ───────────────────────────',
        f'Guests invited: {guest_count}',
        f'Expected guests: {expected_guests}',
        '',
        'Log in to your Evently dashboard to check RSVP responses.',
        '',
        'Good luck with your event!',
        'The Evently Team',
    ]

    return '\n'.join(lines)


def _build_guest_reminder(
    event_name, venue_name, event_date,
    event_time, host_name, dress_code,
):
   
    lines = [
        'Hi there,',
        '',
        f'This is a friendly reminder that you have been invited to an upcoming event!',
        '',
        '── Event details ───────────────────────────',
        f'Event:    {event_name}',
        f'Venue:    {venue_name or "—"}',
        f'Date:     {event_date or "—"}',
        f'Time:     {event_time or "—"}',
    ]

    if host_name:
        lines.append(f'Hosted by: {host_name}')

    if dress_code:
        lines.append(f'Dress code: {dress_code}')

    lines += [
        '',
        'We look forward to seeing you there!',
        'The Evently Team',
    ]

    return '\n'.join(lines)