import { LocalAnchor } from '../shared/navigation';
import { Component, ChangeDetectionStrategy, inject, DestroyRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpApi, DialogFocus, defer } from '../shared/http-api';
import { Display } from '../shared/display';
import {
  Event,
  Category,
  Organisation,
  Registration,
  Receipt,
  Forecast,
  EventDraft,
} from '../shared/models';
@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  selector: 'app-page',
  standalone: true,
  imports: [LocalAnchor, CommonModule, FormsModule],
  templateUrl: './registration.html',
})
export class RegistrationComponent {
  readonly vm = this;
  readonly nav = { open: false };
  readonly view = inject(Display);
  readonly destroyRef = inject(DestroyRef);
  loading = false;
  error = '';
  saving = false;
  message = '';
  fields: Record<string, string> = {};
  display!: Display;
  id: string | null = null;
  event!: Event;
  form = { full_name: '', email: '', phone: '', tickets: 1, accept_terms: false };
  phonePattern!: RegExp;
  loadError = '';
  success!: Receipt;
  total!: () => number;
  maxTickets!: () => number;
  load!: () => void;
  register!: (form: NgForm) => void;
  constructor() {
    const Api = inject(HttpApi);
    const display = inject(Display);

    const vm = this;
    vm.display = display;
    vm.id = new URLSearchParams(window.location.search).get('id');
    vm.form = { full_name: '', email: '', phone: '', tickets: 1, accept_terms: false };
    vm.fields = {};
    vm.phonePattern = /^[+\d() .-]+$/;
    vm.total = function () {
      return vm.event
        ? (Math.round(Number(vm.event.ticket_price) * 100) * (Number(vm.form.tickets) || 0)) / 100
        : 0;
    };
    vm.maxTickets = function () {
      return vm.event ? Math.min(10, vm.event.available_tickets) : 10;
    };
    vm.load = function () {
      if (!vm.id) {
        vm.loadError = 'Choose an event from the calendar before registering.';
        return;
      }
      vm.loading = true;
      vm.loadError = '';
      return Api.get<Event>('/api/events/' + vm.id)
        .then(function (event) {
          vm.event = event;
        })
        .catch(function (error) {
          vm.loadError = error.message;
        })
        .finally(function () {
          vm.loading = false;
        });
    };
    vm.register = function (form) {
      if (vm.saving || vm.success) return;
      vm.error = '';
      vm.fields = {};
      const digits = (vm.form.phone || '').replace(/\D/g, '').length;
      if (form.invalid || digits < 7 || digits > 15) {
        vm.error = 'Check your name, email, phone number, ticket quantity and confirmation.';
        if (digits < 7 || digits > 15)
          vm.fields.phone = 'Enter a phone number with 7 to 15 digits.';
        defer(function () {
          const field = document.querySelector<HTMLElement>('input.ng-invalid');
          if (field) field.focus();
        });
        return;
      }
      vm.saving = true;
      Api.post<Receipt>('/api/events/' + vm.id + '/registrations', structuredClone(vm.form))
        .then(function (data) {
          vm.success = data;
          defer(function () {
            const receipt = document.getElementById('confirmation-title');
            if (receipt) receipt.focus();
          });
        })
        .catch(function (error) {
          vm.error = error.message;
          vm.fields = error.fields;
          vm.load();
        })
        .finally(function () {
          vm.saving = false;
        });
    };
    vm.load();
  }
}
