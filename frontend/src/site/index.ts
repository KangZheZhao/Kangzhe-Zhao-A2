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
export class HomeComponent {
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
  load!: () => void;
  constructor() {
    const Api = inject(HttpApi);
    const display = inject(Display);

    const vm = this;
    vm.display = display;
    vm.events = [];
    vm.load = function () {
      vm.loading = true;
      vm.error = '';
      return Api.get<Event[]>('/api/events')
        .then(function (events) {
          vm.events = events;
        })
        .catch(function (error) {
          vm.error = error.message;
        })
        .finally(function () {
          vm.loading = false;
        });
    };
    vm.load();
  }
}
