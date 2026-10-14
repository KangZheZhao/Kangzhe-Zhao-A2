import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { AdminEventComponent } from './event';
const detail = {
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
    {
      id: 4,
      event_id: 1,
      full_name: 'Mia Tran',
      email: 'mia.tran@example.com',
      phone: '0400000104',
      registered_at: '2026-10-13 09:42:51.802067',
      tickets: 2,
      unit_price: 25,
      total_amount: 50,
    },
    {
      id: 3,
      event_id: 1,
      full_name: 'Oliver Reed',
      email: 'oliver.reed@example.com',
      phone: '0400000103',
      registered_at: '2026-10-10 09:42:51.802067',
      tickets: 3,
      unit_price: 25,
      total_amount: 75,
    },
    {
      id: 2,
      event_id: 1,
      full_name: 'Priya Shah',
      email: 'priya.shah@example.com',
      phone: '0400000102',
      registered_at: '2026-10-08 09:42:51.802067',
      tickets: 1,
      unit_price: 25,
      total_amount: 25,
    },
    {
      id: 1,
      event_id: 1,
      full_name: 'Alex Chen',
      email: 'alex.chen@example.com',
      phone: '0400000101',
      registered_at: '2026-10-06 09:42:51.802067',
      tickets: 2,
      unit_price: 25,
      total_amount: 50,
    },
  ],
};
const categories = [
  { id: 3, name: 'Arts & Music', event_count: 3 },
  { id: 4, name: 'Community Market', event_count: 2 },
  { id: 1, name: 'Fun Run', event_count: 3 },
  { id: 2, name: 'Gala & Dinner', event_count: 2 },
];
const organisations = [
  {
    id: 1,
    name: 'Sydney Community Giving',
    mission:
      'We organise Sydney fundraisers for food relief, youth mentoring, housing support and creative learning.',
    contact_email: 'hello@sydneycommunitygiving.example',
  },
];
describe('Staff edit with the original database values', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    history.replaceState(null, '', '/admin/event.html?id=1');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  async function ready() {
    const fixture = TestBed.createComponent(AdminEventComponent);
    http.expectOne((r) => r.url.endsWith('/api/categories')).flush(categories);
    http.expectOne((r) => r.url.endsWith('/api/organisations')).flush(organisations);
    http.expectOne((r) => r.url.endsWith('/api/admin/events/1')).flush(detail);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  it('renders registrations and retains the event local date and times', async () => {
    const fixture = await ready();
    const data = fixture.componentInstance.event;
    expect(data.dateModel).toBe(detail.event_date);
    expect(data.startModel).toBe(detail.start_time);
    expect(data.endModel).toBe(detail.end_time);
    expect(fixture.nativeElement.querySelector('input[name="name"]').value).toBe(detail.name);
    expect(fixture.nativeElement.textContent).toMatch(/registrations/i);
  });
  it('submits an unchanged event with the original date, time and identity', async () => {
    const fixture = await ready();
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new globalThis.Event('submit', { bubbles: true, cancelable: true }));
    const request = http.expectOne((r) => r.method === 'PUT');
    expect(request.request.url).toContain('/api/admin/events/1');
    expect(request.request.body.event_date).toBe(detail.event_date);
    expect(request.request.body.start_time).toBe(detail.start_time);
    expect(request.request.body.end_time).toBe(detail.end_time);
    expect(request.request.body.version).toBe(detail.version);
    request.flush(detail);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toMatch(/Saved|saved/);
  });
  it('blocks an end time before the start before issuing a write', async () => {
    const fixture = await ready();
    fixture.componentInstance.event.startModel = '10:00';
    fixture.componentInstance.event.endModel = '09:00';
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new globalThis.Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    http.expectNone((r) => r.method === 'PUT' || r.method === 'POST');
    expect(fixture.nativeElement.textContent).toMatch(/after|times/);
  });
});
