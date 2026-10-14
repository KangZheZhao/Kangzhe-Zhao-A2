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
  templateUrl: './event.html',
})
export class EventComponent {
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
  event: Event | null = null;
  weather: Forecast = { available: false };
  weatherLoading = false;
  weatherError = '';
  loadWeather!: () => void;
  load!: () => void;
  constructor() {
    const Api = inject(HttpApi);
    const display = inject(Display);

    const vm = this;
    vm.display = display;
    vm.id = new URLSearchParams(window.location.search).get('id');
    vm.loadWeather = function () {
      vm.weatherLoading = true;
      vm.weatherError = '';
      return Api.get<Forecast>('/api/events/' + vm.id + '/weather')
        .then(function (weather) {
          vm.weather = weather;
        })
        .catch(function (error) {
          vm.weatherError = error.message;
        })
        .finally(function () {
          vm.weatherLoading = false;
        });
    };
    vm.load = function () {
      if (!vm.id) {
        vm.error = 'Choose an event from the calendar to see its details.';
        return;
      }
      vm.loading = true;
      vm.error = '';
      return Api.get<Event>('/api/events/' + vm.id)
        .then(function (event) {
          vm.event = event;
          document.title = event.name + ' | Sydney Community Giving';
          vm.loadWeather();
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
