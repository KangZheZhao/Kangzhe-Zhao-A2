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
  templateUrl: './search.html',
})
export class SearchComponent {
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
  categories: Category[] = [];
  categoryError = '';
  filters: { date?: string; location?: string; categoryId?: number | null } = {};
  search!: (form?: NgForm) => void;
  clear!: (form?: NgForm) => void;
  loadCategories!: () => void;
  constructor() {
    const Api = inject(HttpApi);
    const display = inject(Display);

    const vm = this;
    vm.display = display;
    vm.events = [];
    vm.categories = [];
    vm.filters = {};
    let searchNumber = 0;
    vm.search = function (form) {
      if (form && form.invalid) {
        vm.error = 'Check the date and location before searching.';
        return;
      }
      const current = ++searchNumber;
      vm.loading = true;
      vm.error = '';
      const params: Record<string, string> = {};
      if (vm.filters.date) params.date = display.dateValue(vm.filters.date);
      if (vm.filters.location && vm.filters.location.trim())
        params.location = vm.filters.location.trim();
      if (vm.filters.categoryId) params.categoryId = String(vm.filters.categoryId);
      window.history.replaceState(
        null,
        '',
        display.path('/search.html') +
          (Object.keys(params).length ? '?' + new URLSearchParams(params) : ''),
      );
      return Api.get<Event[]>('/api/events', params)
        .then(function (events) {
          if (current === searchNumber) vm.events = events;
        })
        .catch(function (error) {
          if (current === searchNumber) {
            vm.error = error.message;
            vm.events = [];
          }
        })
        .finally(function () {
          if (current === searchNumber) vm.loading = false;
        });
    };
    vm.clear = function (form) {
      vm.filters = {};
      if (form) {
        form?.form.markAsPristine();
        form?.form.markAsUntouched();
      }
      vm.search();
    };
    vm.loadCategories = function () {
      vm.categoryError = '';
      return Api.get<Category[]>('/api/categories')
        .then(function (rows) {
          vm.categories = rows;
        })
        .catch(function (error) {
          vm.categoryError = error.message;
        });
    };
    const query = new URLSearchParams(window.location.search);
    const date = query.get('date');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) vm.filters.date = date;
    vm.filters.location = query.get('location') || '';
    vm.filters.categoryId = Number(query.get('categoryId')) || null;
    vm.loadCategories();
    vm.search();
  }
}
