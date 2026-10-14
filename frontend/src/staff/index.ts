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
  templateUrl: './index.html',
})
export class AdminListComponent {
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
  events: Event[] = [];
  state = '';
  query = '';
  sort = 'event_date';
  pendingDelete!: Event | null;
  deleting = false;
  load!: () => void;
  matches!: (event: Event) => boolean;
  count!: (state?: string) => number;
  ticketCount!: () => number;
  askDelete!: (event: Event) => void;
  deleteEvent!: () => void;
  visibleEvents = () =>
    this.events
      .filter(this.matches)
      .sort((a, b) =>
        String(a[this.sort as keyof Event]).localeCompare(String(b[this.sort as keyof Event])),
      );
  constructor() {
    const Api = inject(HttpApi);
    const display = inject(Display);

    const vm = this;
    vm.display = display;
    vm.events = [];
    vm.state = '';
    vm.query = '';
    vm.sort = 'event_date';
    vm.load = function () {
      vm.loading = true;
      vm.error = '';
      return Api.get<Event[]>('/api/admin/events')
        .then(function (rows) {
          vm.events = rows;
        })
        .catch(function (error) {
          vm.error = error.message;
        })
        .finally(function () {
          vm.loading = false;
        });
    };
    vm.matches = function (event) {
      const text = vm.query.toLowerCase().trim();
      return (
        (!vm.state || event.status === vm.state) &&
        (!text ||
          (event.name + ' ' + event.suburb + ' ' + event.category_name)
            .toLowerCase()
            .includes(text))
      );
    };
    vm.count = function (state) {
      return vm.events.filter(function (event) {
        return !state || event.status === state;
      }).length;
    };
    vm.ticketCount = function () {
      return vm.events.reduce(function (sum, event) {
        return sum + event.tickets_booked;
      }, 0);
    };
    vm.askDelete = function (event) {
      vm.pendingDelete = event;
      vm.error = '';
      vm.message = '';
    };
    vm.deleteEvent = function () {
      if (vm.deleting) return;
      const event = vm.pendingDelete;
      if (!event) return;
      vm.deleting = true;
      Api.remove('/api/admin/events/' + event.id)
        .then(function () {
          vm.events = vm.events.filter(function (row) {
            return row.id !== event.id;
          });
          vm.message = event.name + ' deleted.';
          vm.pendingDelete = null;
        })
        .catch(function (error) {
          vm.error = error.message;
          vm.pendingDelete = null;
        })
        .finally(function () {
          vm.deleting = false;
        });
    };
    vm.load();
  }
}
