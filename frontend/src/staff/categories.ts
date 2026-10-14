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
  templateUrl: './categories.html',
})
export class CategoriesComponent {
  readonly vm = this;
  readonly nav = { open: false };
  readonly view = inject(Display);
  readonly destroyRef = inject(DestroyRef);
  loading = false;
  error = '';
  saving = false;
  message = '';
  fields: Record<string, string> = {};
  categories: Category[] = [];
  form: Partial<Category> & { name: string } = { name: '' };
  pendingDelete!: Category | null;
  deleting = false;
  load!: () => void;
  edit!: (category: Category, form: NgForm) => void;
  cancel!: (form: NgForm) => void;
  save!: (form: NgForm) => void;
  deleteCategory!: () => void;
  constructor() {
    const Api = inject(HttpApi);

    const vm = this;
    vm.categories = [];
    vm.form = { name: '' };
    vm.load = function () {
      vm.loading = true;
      return Api.get<Category[]>('/api/categories')
        .then(function (rows) {
          vm.categories = rows;
        })
        .catch(function (error) {
          vm.error = error.message;
        })
        .finally(function () {
          vm.loading = false;
        });
    };
    vm.edit = function (category, form) {
      vm.form = { id: category.id, name: category.name };
      vm.error = '';
      vm.message = '';
      form?.form.markAsPristine();
      form?.form.markAsUntouched();
    };
    vm.cancel = function (form) {
      vm.form = { name: '' };
      vm.error = '';
      form?.form.markAsPristine();
      form?.form.markAsUntouched();
    };
    vm.save = function (form) {
      if (vm.saving) return;
      vm.error = '';
      vm.message = '';
      if (form.invalid || !vm.form.name.trim()) {
        vm.error = 'Enter a category name of up to 80 characters.';
        return;
      }
      vm.saving = true;
      const request = vm.form.id
        ? Api.put<Category>('/api/admin/categories/' + vm.form.id, { name: vm.form.name })
        : Api.post<Category>('/api/admin/categories', { name: vm.form.name });
      request
        .then(function () {
          vm.form = { name: '' };
          vm.message = 'Category saved.';
          form?.form.markAsPristine();
          form?.form.markAsUntouched();
          return vm.load();
        })
        .catch(function (error) {
          vm.error = error.message;
        })
        .finally(function () {
          vm.saving = false;
        });
    };
    vm.deleteCategory = function () {
      if (vm.deleting) return;
      vm.deleting = true;
      vm.error = '';
      vm.message = '';
      Api.remove('/api/admin/categories/' + vm.pendingDelete!.id)
        .then(function () {
          vm.message = 'Category deleted.';
          return vm.load();
        })
        .catch(function (error) {
          vm.error = error.message;
        })
        .finally(function () {
          vm.deleting = false;
          vm.pendingDelete = null;
        });
    };
    vm.load();
  }
}
