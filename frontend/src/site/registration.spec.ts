import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { RegistrationComponent } from './registration';

const eventFixture = {
  id: 1,
  organisation_id: 1,
  category_id: 1,
  name: 'Harbour Sunrise Run',
  image_file: 'community-run.jpg',
  short_description: 'A 5 km walk or 10 km run along the harbour.',
  purpose: 'Support neighbourhood food relief.',
  description:
    'Meet at Barangaroo Reserve for a 5 km walk or 10 km run. Volunteers will mark both routes, and breakfast follows at the finish.',
  event_date: '2026-10-21',
  start_time: '07:00',
  end_time: '11:00',
  venue: 'Barangaroo Reserve',
  suburb: 'Barangaroo',
  city: 'Sydney',
  ticket_price: 25,
  goal_amount: 12000,
  raised_amount: 4200,
  is_suspended: false,
  ticket_capacity: 200,
  latitude: -33.8573,
  longitude: 151.2011,
  version: 1,
  category_name: 'Fun Run',
  organisation_name: 'Sydney Community Giving',
  registration_count: 4,
  tickets_booked: 8,
  available_tickets: 192,
  status: 'Active',
  registrations: [
    { id: 4, full_name: 'Mia Tran', registered_at: '2026-10-13 09:42:51.802067', tickets: 2 },
    { id: 3, full_name: 'Oliver Reed', registered_at: '2026-10-10 09:42:51.802067', tickets: 3 },
    { id: 2, full_name: 'Priya Shah', registered_at: '2026-10-08 09:42:51.802067', tickets: 1 },
    { id: 1, full_name: 'Alex Chen', registered_at: '2026-10-06 09:42:51.802067', tickets: 2 },
  ],
};
describe('Registration with actual Angular form directives', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    history.replaceState(null, '', '/registration.html?id=1');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  async function ready() {
    const fixture = TestBed.createComponent(RegistrationComponent);
    http.expectOne((r) => r.url.endsWith('/api/events/1')).flush(eventFixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  it('renders the selected event and blocks an empty form before any POST', async () => {
    const fixture = await ready();
    expect(fixture.nativeElement.textContent).toContain(eventFixture.name);
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new globalThis.Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toMatch(
      /Check|Complete/,
    );
    http.expectNone((r) => r.method === 'POST');
  });
  it('rejects an invalid email through Angular validation', async () => {
    const fixture = await ready();
    const input = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    input.value = 'invalid-address';
    input.dispatchEvent(new globalThis.Event('input', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.classList.contains('ng-invalid')).toBe(true);
  });
  it('uses one in-flight request and renders the real server receipt', async () => {
    const fixture = await ready();
    const component = fixture.componentInstance;
    component.form = {
      full_name: 'Migration Check',
      email: 'migration-check@example.com',
      phone: '+61 400 123 456',
      tickets: 1,
      accept_terms: true,
    };
    fixture.detectChanges();
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new globalThis.Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new globalThis.Event('submit', { bubbles: true, cancelable: true }));
    const requests = http.match((r) => r.method === 'POST');
    expect(requests).toHaveLength(1);
    expect(requests[0].request.body.email).toBe('migration-check@example.com');
    requests[0].flush({
      registration: {
        id: 91,
        full_name: 'Migration Check',
        registered_at: '2026-10-14T01:00:00.000Z',
        tickets: 1,
        total_amount: 0,
      },
      event_name: 'Harbour Sunrise Run',
      message: 'Your registration is confirmed.',
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('SCG-91');
    expect(fixture.nativeElement.textContent).toContain('on the list');
  });
  it('shows a duplicate-registration response and lets the user correct it', async () => {
    const fixture = await ready();
    const component = fixture.componentInstance;
    component.form = {
      full_name: 'Migration Check',
      email: 'migration-check@example.com',
      phone: '+61 400 123 456',
      tickets: 1,
      accept_terms: true,
    };
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new globalThis.Event('submit', { bubbles: true, cancelable: true }));
    http
      .expectOne((r) => r.method === 'POST')
      .flush(
        { error: 'This email address is already registered for this event.' },
        { status: 409, statusText: 'Conflict' },
      );
    await new Promise((resolve) => setTimeout(resolve, 0));
    http.expectOne((r) => r.url.endsWith('/api/events/1')).flush(eventFixture);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('already registered');
  });
});
