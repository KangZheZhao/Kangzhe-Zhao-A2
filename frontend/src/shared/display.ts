import { Injectable } from '@angular/core';
import { Event } from './models';
@Injectable({ providedIn: 'root' })
export class Display {
  money(value?: number | null): string {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(
      value || 0,
    );
  }
  dateValue(value?: Date | string | null): string {
    if (typeof value === 'string') return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
    if (!value || Number.isNaN(value.getTime())) return '';
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  timeValue(value?: Date | string | null): string {
    if (typeof value === 'string') return value.slice(0, 5);
    return value
      ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
      : '';
  }
  path(value: string): string {
    return (
      new URL(value.replace(/^\//, ''), this.base()).pathname +
      new URL(value.replace(/^\//, ''), this.base()).search
    );
  }
  private base(): string {
    return new URL(document.baseURI).pathname.endsWith('/admin/')
      ? new URL('../', document.baseURI).href
      : document.baseURI;
  }
  date(value?: string, options: Intl.DateTimeFormatOptions = {}): string {
    if (!value) return '';
    const date = new Date(value + 'T12:00:00Z');
    return Number.isNaN(date.getTime())
      ? ''
      : new Intl.DateTimeFormat('en-AU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
          ...options,
        }).format(date);
  }
  day(value?: string): string {
    return this.date(value, { day: '2-digit', month: undefined, year: undefined });
  }
  month(value?: string): string {
    return this.date(value, { day: undefined, month: 'short', year: undefined });
  }
  timestamp(value?: string): string {
    if (!value) return '';
    const date = new Date(value.replace(' ', 'T') + (value.endsWith('Z') ? '' : 'Z'));
    return Number.isNaN(date.getTime())
      ? ''
      : new Intl.DateTimeFormat('en-AU', {
          timeZone: 'Australia/Sydney',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short',
        }).format(date);
  }
  percent(event: Partial<Event>): number {
    return Math.round(((event.raised_amount || 0) / (event.goal_amount || 1)) * 100);
  }
  progress(event: Partial<Event>): number {
    return Math.max(0, Math.min(100, this.percent(event)));
  }
  eventUrl(event: Partial<Event>): string {
    return this.path('/event.html?id=' + event.id);
  }
  registrationUrl(event: Partial<Event>): string {
    return this.path('/registration.html?id=' + event.id);
  }
  image(event: Partial<Event>): string {
    return this.path('/assets/' + event.image_file);
  }
}
