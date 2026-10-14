import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ApiError, HttpApi } from './http-api';

describe('HTTP contracts and hosted application paths', () => {
  let http: HttpTestingController;
  let api: HttpApi;
  beforeEach(() => {
    document.head.querySelector('base')?.remove();
    const base = document.createElement('base');
    base.href = '/example-a3/';
    document.head.append(base);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(HttpApi);
  });
  afterEach(() => {
    http.verify();
    document.head.querySelector('base')?.remove();
  });
  it('retains combined event filters inside the public deployment prefix', async () => {
    const result = api.get<{ id: number }[]>('api/events', {
      date: '2026-10-20',
      location: 'Bondi & coast',
    });
    const req = http.expectOne((r) => r.url.endsWith('/example-a3/api/events'));
    expect(req.request.params.get('date')).toBe('2026-10-20');
    expect(req.request.params.get('location')).toBe('Bondi & coast');
    req.flush([{ id: 1 }]);
    expect(await result).toEqual([{ id: 1 }]);
  });
  it('uses the public API from a separately based staff application', async () => {
    document.querySelector('base')!.href = '/example-a3/admin/';
    const result = api.get('api/admin/events');
    const req = http.expectOne((r) => r.url.endsWith('/example-a3/api/admin/events'));
    req.flush([]);
    await result;
  });
  it('preserves server validation errors without losing field feedback', async () => {
    const result = api.post('api/events/1/registrations', { email: 'invalid' });
    const rejected = expect(result).rejects.toMatchObject({
      status: 400,
      message: 'Check the email.',
      fields: { email: 'Enter a valid email.' },
    });
    http
      .expectOne((r) => r.url.endsWith('/api/events/1/registrations'))
      .flush(
        { error: 'Check the email.', fields: { email: 'Enter a valid email.' } },
        { status: 400, statusText: 'Bad Request' },
      );
    await rejected;
  });
  it('sends event updates as JSON and keeps delete methods distinct', async () => {
    const update = api.put('api/admin/events/7', { name: 'Changed event' });
    const request = http.expectOne((r) => r.method === 'PUT');
    expect(request.request.body).toEqual({ name: 'Changed event' });
    request.flush({ id: 7 });
    await update;
    const removal = api.remove('api/admin/events/7');
    http
      .expectOne((r) => r.method === 'DELETE')
      .flush(null, { status: 204, statusText: 'No Content' });
    await removal;
  });
});
