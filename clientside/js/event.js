document.addEventListener('DOMContentLoaded', async () => {
  const status = document.getElementById('event-status');
  const content = document.getElementById('event-content');
  const id = new URLSearchParams(window.location.search).get('id');

  if (!id || !/^[1-9]\d*$/.test(id)) {
    status.textContent = 'Choose an event from the home or search page to view its details.';
    return;
  }

  try {
    const event = await window.CharitySite.requestJSON(`/api/events/${encodeURIComponent(id)}`);
    const setText = (elementId, value) => {
      document.getElementById(elementId).textContent = value;
    };
    setText('event-category', event.category_name);
    setText('event-name', event.name);
    setText('breadcrumb-current', event.name);
    setText('event-short-description', event.short_description);
    setText('event-description', event.description);
    setText('event-purpose', event.purpose);
    setText('organisation-mission', event.organisation_mission);
    setText('event-date-time', `${window.CharitySite.formatDate(event.event_date)}, ${event.start_time}–${event.end_time}`);
    setText('event-location', `${event.venue}, ${event.suburb}, ${event.city}`);
    setText('event-ticket', Number(event.ticket_price) === 0 ? 'Free' : window.CharitySite.formatMoney(event.ticket_price));
    setText('event-organiser', event.organisation_name);
    setText('amount-raised', window.CharitySite.formatMoney(event.raised_amount));
    setText('amount-goal', window.CharitySite.formatMoney(event.goal_amount));

    const image = window.CharitySite.eventImage(event);
    document.getElementById('event-image').src = image.src;
    document.getElementById('event-image').alt = image.alt;

    const percentage = Math.round(Number(event.raised_amount) / Number(event.goal_amount) * 100);
    const visiblePercentage = Math.min(Math.max(percentage, 0), 100);
    document.getElementById('progress-fill').style.width = `${visiblePercentage}%`;
    document.getElementById('progress-track').setAttribute('aria-valuenow', String(visiblePercentage));
    setText('progress-caption', `${percentage}% of the fundraising goal reached`);
    document.title = `${event.name} | Sydney Community Giving`;
    document.getElementById('registration-form').addEventListener('submit', submitEvent => {
      submitEvent.preventDefault();
      window.alert('This feature is currently under construction.');
    });
    status.textContent = '';
    content.hidden = false;
  } catch (error) {
    status.textContent = error.message;
    status.classList.add('status-error');
  }
});
