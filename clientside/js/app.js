'use strict';
(function () {
  const app = angular.module('charitySite', []);
  app.factory('Api', ['$http', '$q', function ($http, $q) {
    function call(method, url, data, params) {
      return $http({ method, url, data, params, timeout: 12000, headers: { Accept: 'application/json' } })
        .then(function (response) { return response.data; }, function (response) {
          const error = new Error(response.data && response.data.error ||
            (response.status === -1 ? 'The server could not be reached. Try again.' : 'The request could not be completed.'));
          error.fields = response.data && response.data.fields || {};
          error.status = response.status;
          return $q.reject(error);
        });
    }
    return {
      get: function (url, params) { return call('GET', url, undefined, params); },
      post: function (url, data) { return call('POST', url, data); },
      put: function (url, data) { return call('PUT', url, data); },
      remove: function (url) { return call('DELETE', url); }
    };
  }]);
  app.factory('Display', function () {
    const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
    function date(value, options) {
      if (!value) return '';
      const parsed = new Date(value + 'T12:00:00Z');
      return Number.isNaN(parsed.valueOf()) ? '' : new Intl.DateTimeFormat('en-AU',
        Object.assign({ day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }, options)).format(parsed);
    }
    return {
      money: function (value) { return money.format(Number(value) || 0); },
      date,
      day: function (value) { return date(value, { day: '2-digit', month: undefined, year: undefined }); },
      month: function (value) { return date(value, { day: undefined, month: 'short', year: undefined }); },
      timestamp: function (value) {
        if (!value) return '';
        const parsed = new Date(value.replace(' ', 'T') + (value.endsWith('Z') ? '' : 'Z'));
        return Number.isNaN(parsed.valueOf()) ? '' : new Intl.DateTimeFormat('en-AU', {
          timeZone: 'Australia/Sydney', day: 'numeric', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
        }).format(parsed);
      },
      percent: function (event) { return Math.round(Number(event.raised_amount) / Number(event.goal_amount) * 100); },
      progress: function (event) { return Math.max(0, Math.min(100, Math.round(Number(event.raised_amount) / Number(event.goal_amount) * 100))); },
      eventUrl: function (event) { return '/event.html?id=' + event.id; },
      registrationUrl: function (event) { return '/registration.html?id=' + event.id; },
      image: function (event) { return '/assets/' + event.image_file; },
      dateValue: function (value) {
        if (!(value instanceof Date) || Number.isNaN(value.valueOf())) return '';
        return value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0');
      },
      timeValue: function (value) {
        return value instanceof Date ? String(value.getHours()).padStart(2, '0') + ':' + String(value.getMinutes()).padStart(2, '0') : '';
      }
    };
  });
  function eventId() {
    const value = new URLSearchParams(window.location.search).get('id');
    return value && /^[1-9]\d*$/.test(value) ? value : null;
  }
  app.controller('HomeController', ['Api', 'Display', function (Api, Display) {
    const vm = this;
    vm.display = Display;
    vm.events = [];
    vm.load = function () {
      vm.loading = true; vm.error = '';
      return Api.get('/api/events').then(function (events) { vm.events = events; })
        .catch(function (error) { vm.error = error.message; }).finally(function () { vm.loading = false; });
    };
    vm.load();
  }]);
  app.controller('SearchController', ['Api', 'Display', '$window', function (Api, Display, $window) {
    const vm = this;
    vm.display = Display; vm.events = []; vm.categories = []; vm.filters = {};
    let searchNumber = 0;
    vm.search = function (form) {
      if (form && form.$invalid) { vm.error = 'Check the date and location before searching.'; return; }
      const current = ++searchNumber;
      vm.loading = true; vm.error = '';
      const params = {};
      if (vm.filters.date) params.date = Display.dateValue(vm.filters.date);
      if (vm.filters.location && vm.filters.location.trim()) params.location = vm.filters.location.trim();
      if (vm.filters.categoryId) params.categoryId = vm.filters.categoryId;
      $window.history.replaceState(null, '', '/search.html' + (Object.keys(params).length ? '?' + new URLSearchParams(params) : ''));
      return Api.get('/api/events', params).then(function (events) { if (current === searchNumber) vm.events = events; })
        .catch(function (error) { if (current === searchNumber) { vm.error = error.message; vm.events = []; } })
        .finally(function () { if (current === searchNumber) vm.loading = false; });
    };
    vm.clear = function (form) {
      vm.filters = {}; if (form) { form.$setPristine(); form.$setUntouched(); } vm.search();
    };
    vm.loadCategories = function () {
      vm.categoryError = '';
      return Api.get('/api/categories').then(function (rows) { vm.categories = rows; })
        .catch(function (error) { vm.categoryError = error.message; });
    };
    const query = new URLSearchParams($window.location.search);
    const date = query.get('date');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) vm.filters.date = new Date(date + 'T12:00:00');
    vm.filters.location = query.get('location') || '';
    vm.filters.categoryId = Number(query.get('categoryId')) || null;
    vm.loadCategories(); vm.search();
  }]);
  app.controller('EventController', ['Api', 'Display', function (Api, Display) {
    const vm = this;
    vm.display = Display; vm.id = eventId();
    vm.loadWeather = function () {
      vm.weatherLoading = true; vm.weatherError = '';
      return Api.get('/api/events/' + vm.id + '/weather').then(function (weather) { vm.weather = weather; })
        .catch(function (error) { vm.weatherError = error.message; }).finally(function () { vm.weatherLoading = false; });
    };
    vm.load = function () {
      if (!vm.id) { vm.error = 'Choose an event from the calendar to see its details.'; return; }
      vm.loading = true; vm.error = '';
      return Api.get('/api/events/' + vm.id).then(function (event) {
        vm.event = event; document.title = event.name + ' | Sydney Community Giving'; vm.loadWeather();
      }).catch(function (error) { vm.error = error.message; }).finally(function () { vm.loading = false; });
    };
    vm.load();
  }]);
  app.controller('RegistrationController', ['Api', 'Display', '$timeout', function (Api, Display, $timeout) {
    const vm = this;
    vm.display = Display; vm.id = eventId(); vm.form = { tickets: 1, accept_terms: false }; vm.fields = {};
    vm.phonePattern = /^[+\d() .-]+$/;
    vm.total = function () { return vm.event ? Math.round(Number(vm.event.ticket_price) * 100) * (Number(vm.form.tickets) || 0) / 100 : 0; };
    vm.maxTickets = function () { return vm.event ? Math.min(10, vm.event.available_tickets) : 10; };
    vm.load = function () {
      if (!vm.id) { vm.loadError = 'Choose an event from the calendar before registering.'; return; }
      vm.loading = true; vm.loadError = '';
      return Api.get('/api/events/' + vm.id).then(function (event) { vm.event = event; })
        .catch(function (error) { vm.loadError = error.message; }).finally(function () { vm.loading = false; });
    };
    vm.register = function (form) {
      if (vm.saving || vm.success) return;
      vm.error = ''; vm.fields = {};
      const digits = (vm.form.phone || '').replace(/\D/g, '').length;
      if (form.$invalid || digits < 7 || digits > 15) {
        vm.error = 'Check your name, email, phone number, ticket quantity and confirmation.';
        if (digits < 7 || digits > 15) vm.fields.phone = 'Enter a phone number with 7 to 15 digits.';
        $timeout(function () { const field = document.querySelector('input.ng-invalid'); if (field) field.focus(); });
        return;
      }
      vm.saving = true;
      Api.post('/api/events/' + vm.id + '/registrations', angular.copy(vm.form))
        .then(function (data) {
          vm.success = data;
          $timeout(function () { const receipt = document.getElementById('confirmation-title'); if (receipt) receipt.focus(); });
        }).catch(function (error) { vm.error = error.message; vm.fields = error.fields; vm.load(); })
        .finally(function () { vm.saving = false; });
    };
    vm.load();
  }]);
  app.controller('AboutController', ['Api', function (Api) {
    const vm = this;
    vm.load = function () {
      vm.error = '';
      Api.get('/api/organisations').then(function (rows) { vm.organisation = rows[0]; }).catch(function (error) { vm.error = error.message; });
    };
    vm.load();
  }]);
}());
