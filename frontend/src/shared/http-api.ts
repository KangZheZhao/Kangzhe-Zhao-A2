import { Directive, DestroyRef, ElementRef, inject, AfterViewInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, timeout, catchError, throwError } from 'rxjs';
import { NgForm } from '@angular/forms';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

@Injectable({ providedIn: 'root' })
export class HttpApi {
  private readonly http = inject(HttpClient);
  request<T>(
    method: string,
    path: string,
    body?: unknown,
    params: Record<string, string | number | boolean> = {},
    milliseconds = 12000,
  ): Promise<T> {
    const base = new URL(document.baseURI).pathname.endsWith('/admin/')
      ? new URL('../', document.baseURI).href
      : document.baseURI;
    const url = new URL(path.replace(/^\//, ''), base).href;
    return firstValueFrom(
      this.http
        .request<T>(method, url, { body, params, headers: { Accept: 'application/json' } })
        .pipe(
          timeout(milliseconds),
          catchError((error: unknown) => {
            const response = error instanceof HttpErrorResponse ? error : null;
            const payload = response?.error as {
              error?: string;
              fields?: Record<string, string>;
            } | null;
            return throwError(
              () =>
                new ApiError(
                  payload?.error ||
                    'The event service could not be reached. Check your connection and try again.',
                  response?.status || 0,
                  payload?.fields || {},
                ),
            );
          }),
        ),
    );
  }
  get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>('GET', path, undefined, params);
  }
  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }
  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }
  remove(path: string): Promise<void> {
    return this.request<void>('DELETE', path);
  }
}

export function resetForm(form?: NgForm): void {
  form?.form.markAsPristine();
  form?.form.markAsUntouched();
}
export function focusAfterRender(selector: string): void {
  setTimeout(() => document.querySelector<HTMLElement>(selector)?.focus(), 0);
}
export function defer(action: () => void, delay = 0): void {
  setTimeout(action, delay);
}

@Directive({ selector: '[dialogFocus]' })
export class DialogFocus implements AfterViewInit {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroy = inject(DestroyRef);
  ngAfterViewInit(): void {
    const previous = document.activeElement as HTMLElement | null;
    const controls = () =>
      Array.from(
        this.element.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled])',
        ),
      );
    defer(() => {
      if (this.element.isConnected) controls()[0]?.focus();
    });
    const handle = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const list = controls(),
        first = list[0],
        last = list.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    this.element.addEventListener('keydown', handle);
    this.destroy.onDestroy(() => {
      this.element.removeEventListener('keydown', handle);
      if (previous?.isConnected) previous.focus();
    });
  }
}
