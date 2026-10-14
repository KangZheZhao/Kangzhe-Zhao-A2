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
  templateUrl: './about.html',
})
export class AboutComponent {
  readonly vm = this;
  readonly nav = { open: false };
  readonly view = inject(Display);
  readonly destroyRef = inject(DestroyRef);
  loading = false;
  error = '';
  saving = false;
  message = '';
  fields: Record<string, string> = {};
  organisation!: Organisation;
  load!: () => void;
  constructor() {
    const Api = inject(HttpApi);

    const vm = this;
    vm.load = function () {
      vm.error = '';
      Api.get<Organisation[]>('/api/organisations')
        .then(function (rows) {
          vm.organisation = rows[0];
        })
        .catch(function (error) {
          vm.error = error.message;
        });
    };
    vm.load();
  }
}
