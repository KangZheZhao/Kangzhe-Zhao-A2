(() => {
  const moneyFormatter = new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', maximumFractionDigits: 0
  });

  async function requestJSON(url) {
    let response;
    try {
      response = await fetch(url, { headers: { Accept: 'application/json' } });
    } catch (_error) {
      throw new Error('Could not connect to the website. Please try again.');
    }
    let data;
    try {
      data = await response.json();
    } catch (_error) {
      throw new Error('The server returned an unexpected response.');
    }
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong. Please try again.');
    }
    return data;
  }

  function dateFromSql(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  function formatDate(value, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
    const date = dateFromSql(value);
    if (!date) return 'Date to be confirmed';
    return new Intl.DateTimeFormat('en-AU', { ...options, timeZone: 'UTC' }).format(date);
  }

  function formatMoney(value) {
    return moneyFormatter.format(Number(value) || 0);
  }

  function eventTone(category) {
    const tones = {
      'Fun Run': 'tone-run',
      'Gala & Dinner': 'tone-gala',
      'Arts & Music': 'tone-arts',
      'Community Market': 'tone-market'
    };
    return tones[category] || 'tone-default';
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function createEventCard(event) {
    const card = element('article', 'event-card');
    const art = element('div', `event-card-art ${eventTone(event.category_name)}`);
    art.setAttribute('aria-hidden', 'true');
    art.append(
      element('span', 'card-art-spark', '✳'),
      element('span', 'card-art-word', event.category_name)
    );

    const content = element('div', 'event-card-content');
    const top = element('div', 'card-topline');
    top.append(
      element('span', 'category-pill', event.category_name),
      element('span', 'card-date', formatDate(event.event_date, { day: 'numeric', month: 'short' }))
    );
    const heading = element('h3', 'card-title');
    const link = element('a', '', event.name);
    link.href = `/event.html?id=${encodeURIComponent(event.id)}`;
    link.setAttribute('aria-label', `View details for ${event.name}`);
    heading.append(link);

    const description = element('p', 'card-description', event.short_description);
    const footer = element('div', 'card-footer');
    const place = element('span', 'card-place', `${event.suburb}, ${event.city}`);
    const price = Number(event.ticket_price) === 0 ? 'Free entry' : `${formatMoney(event.ticket_price)} ticket`;
    footer.append(place, element('span', 'card-price', price));
    content.append(top, heading, description, footer);
    card.append(art, content);
    return card;
  }

  window.CharitySite = { requestJSON, formatDate, formatMoney, createEventCard };
})();

