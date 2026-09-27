document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('event-list');
  const status = document.getElementById('event-status');

  try {
    const events = await window.CharitySite.requestJSON('/api/events');
    list.replaceChildren(...events.map(window.CharitySite.createEventCard));
    status.textContent = events.length === 0
      ? 'There are no upcoming events right now. Please check back soon.'
      : '';
  } catch (error) {
    status.textContent = error.message;
    status.classList.add('status-error');
  }
});

