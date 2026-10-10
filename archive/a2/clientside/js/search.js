document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('search-form');
  const categorySelect = document.getElementById('category');
  const results = document.getElementById('search-results');
  const status = document.getElementById('search-status');
  const categoryStatus = document.getElementById('category-status');
  const count = document.getElementById('result-count');
  let latestRequest = 0;

  async function loadCategories() {
    const categories = await window.CharitySite.requestJSON('/api/categories');
    for (const category of categories) {
      const option = document.createElement('option');
      option.value = String(category.id);
      option.textContent = category.name;
      categorySelect.append(option);
    }
  }

  async function loadEvents() {
    const requestNumber = ++latestRequest;
    const parameters = new URLSearchParams();
    const date = form.elements.date.value;
    const location = form.elements.location.value.trim();
    const categoryId = form.elements.categoryId.value;
    if (date) parameters.set('date', date);
    if (location) parameters.set('location', location);
    if (categoryId) parameters.set('categoryId', categoryId);
    const url = `/api/events${parameters.size ? `?${parameters}` : ''}`;

    status.classList.remove('status-error');
    status.textContent = 'Loading events…';
    results.replaceChildren();
    count.textContent = '';
    try {
      const events = await window.CharitySite.requestJSON(url);
      if (requestNumber !== latestRequest) return;
      results.replaceChildren(...events.map(window.CharitySite.createEventRow));
      count.textContent = `${events.length} ${events.length === 1 ? 'event' : 'events'} found`;
      status.textContent = events.length === 0
        ? 'No events match those filters. Try another date, location or category.'
        : '';
    } catch (error) {
      if (requestNumber !== latestRequest) return;
      status.textContent = error.message;
      status.classList.add('status-error');
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    loadEvents();
  });
  document.getElementById('clear-filters').addEventListener('click', () => {
    form.reset();
    loadEvents();
  });

  (async () => {
    try {
      await loadCategories();
    } catch (error) {
      categoryStatus.textContent = `${error.message} Category filtering is unavailable.`;
      categorySelect.disabled = true;
    }
    await loadEvents();
  })();
});
