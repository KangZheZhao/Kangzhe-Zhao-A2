document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('event-list');
  const featured = document.getElementById('featured-event');
  const status = document.getElementById('event-status');

  try {
    const events = await window.CharitySite.requestJSON('/api/events');
    document.getElementById('event-count').textContent = String(events.length);
    if (events.length) {
      featured.replaceChildren(window.CharitySite.createFeaturedEvent(events[0]));
      list.replaceChildren(...events.slice(1).map(window.CharitySite.createEventRow));
    }
    status.textContent = events.length === 0
      ? 'There are no upcoming events right now. Please check back soon.'
      : '';
  } catch (error) {
    status.textContent = error.message;
    status.classList.add('status-error');
  }
});
