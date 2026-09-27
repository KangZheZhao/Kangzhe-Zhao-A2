(() => {
  const money = new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', maximumFractionDigits: 0
  });

  async function requestJSON(url) {
    let response;
    try {
      response = await fetch(url, { headers: { Accept: 'application/json' } });
    } catch (_error) {
      throw new Error('The server could not be reached. Please try again.');
    }

    let data;
    try {
      data = await response.json();
    } catch (_error) {
      throw new Error('The server returned an unexpected response.');
    }
    if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    return data;
  }

  function dateFromSql(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  function formatDate(value, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
    const date = dateFromSql(value);
    return date
      ? new Intl.DateTimeFormat('en-AU', { ...options, timeZone: 'UTC' }).format(date)
      : 'Date to be confirmed';
  }

  function formatMoney(value) {
    return money.format(Number(value) || 0);
  }

  function eventImage(event) {
    if (event.name.toLowerCase().includes('art')) {
      return { src: '/assets/art-gallery.jpg', alt: 'Art gallery interior' };
    }
    const images = {
      'Fun Run': { src: '/assets/community-run.jpg', alt: 'Runners in Sydney' },
      'Gala & Dinner': { src: '/assets/dinner.jpg', alt: 'Dinner table' },
      'Arts & Music': { src: '/assets/concert.jpg', alt: 'Live musician' },
      'Community Market': { src: '/assets/market.jpg', alt: 'Sydney market' }
    };
    return images[event.category_name] || { src: '/assets/sydney-harbour.jpg', alt: 'Sydney Harbour' };
  }

  function element(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }

  function createEventRow(event) {
    const article = element('article', 'event-row');
    const link = element('a', 'event-row-link');
    link.href = `/event.html?id=${encodeURIComponent(event.id)}`;
    link.setAttribute('aria-label', `View ${event.name} event details`);

    const date = element('time', 'row-date');
    date.dateTime = event.event_date;
    date.append(
      element('span', 'date-day', formatDate(event.event_date, { day: '2-digit' })),
      element('span', 'date-month', formatDate(event.event_date, { month: 'short', year: 'numeric' }))
    );

    const image = element('img', 'row-image');
    image.src = eventImage(event).src;
    image.alt = '';
    image.loading = 'lazy';

    const main = element('div', 'row-main');
    main.append(
      element('p', 'row-category', event.category_name),
      element('h3', 'row-title', event.name),
      element('p', 'row-description', event.short_description)
    );

    const side = element('div', 'row-side');
    side.append(
      element('span', 'row-place', `${event.suburb} · ${event.start_time}`),
      element('strong', 'row-price', Number(event.ticket_price) === 0 ? 'Free' : formatMoney(event.ticket_price)),
      element('span', 'row-arrow', '↗')
    );
    link.append(date, image, main, side);
    article.append(link);
    return article;
  }

  function createFeaturedEvent(event) {
    const article = element('article', 'featured-event');
    const link = element('a', 'featured-link');
    link.href = `/event.html?id=${encodeURIComponent(event.id)}`;
    link.setAttribute('aria-label', `View ${event.name} event details`);
    const photo = element('div', 'featured-photo');
    const image = element('img');
    image.src = eventImage(event).src;
    image.alt = '';
    photo.append(image);
    const copy = element('div', 'featured-copy');
    copy.append(
      element('p', 'featured-label', 'Next on the calendar'),
      element('p', 'featured-date', `${formatDate(event.event_date)} · ${event.start_time}`),
      element('h3', 'featured-title', event.name),
      element('p', 'featured-description', event.short_description),
      element('p', 'featured-location', `${event.venue}, ${event.suburb}`),
      element('span', 'featured-action', 'Event details  ↗')
    );
    link.append(photo, copy);
    article.append(link);
    return article;
  }

  window.CharitySite = { requestJSON, formatDate, formatMoney, eventImage, createEventRow, createFeaturedEvent };
})();
