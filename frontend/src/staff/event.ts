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
export class AdminEventComponent {
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
  event: EventDraft = {};
  original: EventDraft = {};
  registrations: Registration[] = [];
  images: { file: string; name: string }[] = [];
  categories: Category[] = [];
  organisations: Organisation[] = [];
  loadError = '';
  load!: () => void;
  reset!: (form: NgForm) => void;
  save!: (form: NgForm) => void;
  constructor() {
    const Api = inject(HttpApi);
    const display = inject(Display);

    const vm = this;
    const id = new URLSearchParams(window.location.search).get('id');
    vm.id = id;
    vm.display = display;
    vm.fields = {};
    vm.registrations = [];
    vm.images = [
      { file: 'community-run.jpg', name: 'Community run' },
      { file: 'market.jpg', name: 'Market' },
      { file: 'dinner.jpg', name: 'Dinner' },
      { file: 'concert.jpg', name: 'Concert' },
      { file: 'art-gallery.jpg', name: 'Art exhibition' },
      { file: 'sydney-harbour.jpg', name: 'Sydney harbour' },
    ];
    function unpack(event: EventDraft) {
      vm.event = structuredClone(event);
      vm.event.dateModel = event.event_date;
      vm.event.startModel = event.start_time;
      vm.event.endModel = event.end_time;
      vm.event.is_suspended = Boolean(event.is_suspended);
      vm.registrations = event.registrations || [];
      vm.original = structuredClone(vm.event);
      document.title = (vm.id ? 'Edit ' + event.name : 'New event') + ' | Sydney Community Giving';
    }
    vm.load = function () {
      vm.loading = true;
      vm.loadError = '';
      vm.error = '';
      vm.fields = {};
      if (vm.id && !/^[1-9]\d*$/.test(vm.id)) {
        vm.loadError = 'Choose a valid event from the event list.';
        vm.loading = false;
        return;
      }
      return Promise.all([
        Api.get<Category[]>('/api/categories'),
        Api.get<Organisation[]>('/api/organisations'),
        vm.id ? Api.get<Event>('/api/admin/events/' + vm.id) : Promise.resolve(null),
      ])
        .then(function (results) {
          vm.categories = results[0];
          vm.organisations = results[1];
          if (results[2]) unpack(results[2]);
          else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            unpack({
              organisation_id: vm.organisations[0] && vm.organisations[0].id,
              category_id: vm.categories[0] && vm.categories[0].id,
              image_file: 'community-run.jpg',
              city: 'Sydney',
              ticket_price: 0,
              goal_amount: 1000,
              raised_amount: 0,
              ticket_capacity: 200,
              latitude: -33.8688,
              longitude: 151.2093,
              is_suspended: false,
              event_date: display.dateValue(tomorrow),
              start_time: '09:00',
              end_time: '12:00',
              registrations: [],
            });
          }
        })
        .catch(function (error) {
          vm.loadError = error.message;
        })
        .finally(function () {
          vm.loading = false;
        });
    };
    vm.reset = function (form) {
      vm.event = structuredClone(vm.original);
      vm.error = '';
      vm.fields = {};
      vm.message = '';
      form?.form.markAsPristine();
      form?.form.markAsUntouched();
    };
    vm.save = function (form) {
      if (vm.saving) return;
      vm.error = '';
      vm.message = '';
      vm.fields = {};
      if (form.invalid) {
        vm.error = 'Check the marked fields before saving.';
        defer(function () {
          const field = document.querySelector<HTMLElement>(
            'input.ng-invalid, textarea.ng-invalid, select.ng-invalid',
          );
          if (field) field.focus();
        });
        return;
      }
      if (display.timeValue(vm.event.endModel) <= display.timeValue(vm.event.startModel)) {
        vm.error = 'End time must be after start time.';
        vm.fields.endModel = vm.error;
        defer(function () {
          document.getElementById('endModel')?.focus();
        });
        return;
      }
      const data = structuredClone(vm.event);
      data.event_date = display.dateValue(data.dateModel);
      data.start_time = display.timeValue(data.startModel);
      data.end_time = display.timeValue(data.endModel);
      delete data.registrations;
      delete data.dateModel;
      delete data.startModel;
      delete data.endModel;
      vm.saving = true;
      const request = vm.id
        ? Api.put<Event>('/api/admin/events/' + vm.id, data)
        : Api.post<Event>('/api/admin/events', data);
      request
        .then(function (event) {
          vm.id = String(event.id);
          unpack(event);
          window.history.replaceState(null, '', display.path('/admin/event.html?id=' + vm.id));
          vm.message = 'Event saved.';
          form?.form.markAsPristine();
          form?.form.markAsUntouched();
        })
        .catch(function (error) {
          vm.error = error.message;
          vm.fields = error.fields;
          vm.fields.dateModel = vm.fields.event_date;
          vm.fields.startModel = vm.fields.start_time;
          vm.fields.endModel = vm.fields.end_time;
        })
        .finally(function () {
          vm.saving = false;
        });
    };
    vm.load();
  }
}
