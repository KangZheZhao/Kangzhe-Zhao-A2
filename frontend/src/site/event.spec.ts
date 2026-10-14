import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventComponent } from './event';

describe('Public event detail loading and weather', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    history.replaceState(null, '', '/event.html?id=1');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('renders the loading state before the event response arrives', async () => {
    const fixture = TestBed.createComponent(EventComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.textContent).toContain('Loading event details');
    expect(fixture.nativeElement.querySelector('.breadcrumb').textContent).toContain('Details');
    http
      .expectOne((r) => r.url.endsWith('/api/events/1'))
      .flush({ error: 'Event not found.' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
  });

  it('keeps the return and retry controls usable after an API failure', async () => {
    const fixture = TestBed.createComponent(EventComponent);
    fixture.detectChanges();
    http
      .expectOne((r) => r.url.endsWith('/api/events/1'))
      .flush({ error: 'Event not found.' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Event not found.',
    );
    expect(fixture.nativeElement.textContent).toContain('Return to the calendar');
    expect(fixture.nativeElement.textContent).toContain('Try again');
    http.expectNone((r) => r.url.endsWith('/weather'));
  });

  it('renders the event and its dated forecast after the asynchronous responses', async () => {
    const fixture = TestBed.createComponent(EventComponent);
    fixture.detectChanges();
    http
      .expectOne((r) => r.url.endsWith('/api/events/1'))
      .flush({
        id: 1,
        name: 'Harbour Sunrise Run',
        image_file: 'community-run.jpg',
        category_name: 'Fun Run',
        organisation_name: 'Sydney Community Giving',
        event_date: '2026-10-21',
        start_time: '07:00',
        end_time: '11:00',
        venue: 'Barangaroo Reserve',
        suburb: 'Barangaroo',
        city: 'Sydney',
        short_description: 'A harbour run.',
        description: 'Meet at the reserve.',
        purpose: 'Food relief.',
        ticket_price: 25,
        raised_amount: 4200,
        goal_amount: 12000,
        status: 'Active',
        available_tickets: 190,
        tickets_booked: 10,
        registrations: [],
      });
    await Promise.resolve();
    await Promise.resolve();
    http
      .expectOne((r) => r.url.endsWith('/api/events/1/weather'))
      .flush({
        available: true,
        low: 14,
        high: 20,
        description: 'Clear sky',
        rain_chance: 5,
      });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Harbour Sunrise Run');
    const weather = fixture.nativeElement.querySelector('.weather-panel').textContent;
    expect(weather).toContain('21 October 2026');
    expect(weather).toContain('Clear sky');
    expect(weather).toContain('14°–20°C');
    expect(fixture.nativeElement.textContent).toContain('Register for this event');
  });
});
