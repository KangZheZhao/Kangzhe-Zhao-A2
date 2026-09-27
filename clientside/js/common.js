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
    const tones = {
      'Fun Run': 'run',
      'Community Market': 'market',
      'Gala & Dinner': 'dinner',
      'Arts & Music': 'arts'
    };
    const article = element('article', 'event-card');
    article.dataset.tone = tones[event.category_name] || 'default';
    const link = element('a', 'event-card-link');
    link.href = `/event.html?id=${encodeURIComponent(event.id)}`;
    link.setAttribute('aria-label', `View ${event.name} event details`);

    const media = element('div', 'card-media');
    const image = element('img', 'card-image');
    image.src = eventImage(event).src;
    image.alt = '';
    image.loading = 'lazy';
    const date = element('time', 'card-date');
    date.dateTime = event.event_date;
    date.append(
      element('span', 'date-day', formatDate(event.event_date, { day: '2-digit' })),
      element('span', 'date-month', formatDate(event.event_date, { month: 'short', year: 'numeric' }))
    );
    media.append(image, date);

    const body = element('div', 'card-body');
    const bottom = element('div', 'card-bottom');
    bottom.append(
      element('span', 'card-location', `${event.suburb} · ${event.start_time}`),
      element('strong', 'card-price', Number(event.ticket_price) === 0 ? 'Free' : formatMoney(event.ticket_price))
    );
    body.append(
      element('p', 'card-category', event.category_name),
      element('h3', 'card-title', event.name),
      element('p', 'card-description', event.short_description),
      bottom
    );
    link.append(media, body);
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
    const badge = element('time', 'featured-date-badge');
    badge.dateTime = event.event_date;
    badge.append(
      element('span', 'date-day', formatDate(event.event_date, { day: '2-digit' })),
      element('span', 'date-month', formatDate(event.event_date, { month: 'short', year: 'numeric' }))
    );
    photo.append(image, badge);
    const copy = element('div', 'featured-copy');
    const meta = element('div', 'featured-meta');
    meta.append(
      element('span', 'featured-location', `${event.venue}, ${event.suburb}`),
      element('strong', 'featured-price', Number(event.ticket_price) === 0 ? 'Free' : formatMoney(event.ticket_price))
    );
    copy.append(
      element('p', 'featured-label', `Next event · ${event.category_name}`),
      element('p', 'featured-date', `${formatDate(event.event_date)} at ${event.start_time}`),
      element('h3', 'featured-title', event.name),
      element('p', 'featured-description', event.short_description),
      meta,
      element('span', 'featured-action', 'See event details')
    );
    link.append(photo, copy);
    article.append(link);
    return article;
  }

  window.CharitySite = { requestJSON, formatDate, formatMoney, eventImage, createEventRow, createFeaturedEvent };
})();
