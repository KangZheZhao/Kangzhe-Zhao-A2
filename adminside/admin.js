'use strict';
(function () {
  const app = angular.module('charitySite');
  app.controller('AdminListController', ['Api', 'Display', function (Api, Display) {
    const vm = this;
    vm.display = Display; vm.events = []; vm.state = ''; vm.query = '';
    vm.load = function () {
      vm.loading = true; vm.error = '';
      return Api.get('/api/admin/events').then(function (rows) { vm.events = rows; })
        .catch(function (error) { vm.error = error.message; }).finally(function () { vm.loading = false; });
    };
    vm.matches = function (event) {
      const text = vm.query.toLowerCase().trim();
      return (!vm.state || event.status === vm.state) && (!text ||
        (event.name + ' ' + event.suburb + ' ' + event.category_name).toLowerCase().includes(text));
    };
    vm.count = function (state) { return vm.events.filter(function (event) { return !state || event.status === state; }).length; };
    vm.ticketCount = function () { return vm.events.reduce(function (sum, event) { return sum + event.tickets_booked; }, 0); };
    vm.askDelete = function (event) { vm.pendingDelete = event; vm.error = ''; vm.message = ''; };
    vm.deleteEvent = function () {
      if (vm.deleting) return;
      const event = vm.pendingDelete;
      vm.deleting = true;
      Api.remove('/api/admin/events/' + event.id).then(function () {
        vm.events = vm.events.filter(function (row) { return row.id !== event.id; });
        vm.message = event.name + ' deleted.'; vm.pendingDelete = null;
      }).catch(function (error) { vm.error = error.message; vm.pendingDelete = null; })
        .finally(function () { vm.deleting = false; });
    };
    vm.load();
  }]);
  app.controller('AdminEventController', ['Api', 'Display', '$q', '$timeout', function (Api, Display, $q, $timeout) {
    const vm = this;
    const id = new URLSearchParams(window.location.search).get('id');
    vm.id = id; vm.display = Display; vm.fields = {}; vm.registrations = [];
    vm.images = [{ file: 'community-run.jpg', name: 'Community run' }, { file: 'market.jpg', name: 'Market' },
      { file: 'dinner.jpg', name: 'Dinner' }, { file: 'concert.jpg', name: 'Concert' },
      { file: 'art-gallery.jpg', name: 'Art exhibition' }, { file: 'sydney-harbour.jpg', name: 'Sydney harbour' }];
    function unpack(event) {
      vm.event = angular.copy(event);
      vm.event.dateModel = new Date(event.event_date + 'T12:00:00');
      vm.event.startModel = new Date('1970-01-01T' + event.start_time + ':00');
      vm.event.endModel = new Date('1970-01-01T' + event.end_time + ':00');
      vm.event.is_suspended = Boolean(event.is_suspended);
      vm.registrations = event.registrations || [];
      vm.original = angular.copy(vm.event);
      document.title = (vm.id ? 'Edit ' + event.name : 'New event') + ' | Sydney Community Giving';
    }
    vm.load = function () {
      vm.loading = true; vm.loadError = ''; vm.error = ''; vm.fields = {};
      if (vm.id && !/^[1-9]\d*$/.test(vm.id)) { vm.loadError = 'Choose a valid event from the event list.'; vm.loading = false; return; }
      return $q.all([Api.get('/api/categories'), Api.get('/api/organisations'), vm.id ? Api.get('/api/admin/events/' + vm.id) : $q.resolve(null)])
        .then(function (results) {
          vm.categories = results[0]; vm.organisations = results[1];
          if (results[2]) unpack(results[2]);
          else {
            const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
            unpack({ organisation_id: vm.organisations[0] && vm.organisations[0].id,
              category_id: vm.categories[0] && vm.categories[0].id, image_file: 'community-run.jpg',
              city: 'Sydney', ticket_price: 0, goal_amount: 1000, raised_amount: 0, ticket_capacity: 200,
              latitude: -33.8688, longitude: 151.2093, is_suspended: false,
              event_date: Display.dateValue(tomorrow), start_time: '09:00', end_time: '12:00', registrations: [] });
          }
        }).catch(function (error) { vm.loadError = error.message; }).finally(function () { vm.loading = false; });
    };
    vm.reset = function (form) {
      vm.event = angular.copy(vm.original); vm.error = ''; vm.fields = {}; vm.message = '';
      form.$setPristine(); form.$setUntouched();
    };
    vm.save = function (form) {
      if (vm.saving) return;
      vm.error = ''; vm.message = ''; vm.fields = {};
      if (form.$invalid) {
        vm.error = 'Check the marked fields before saving.';
        $timeout(function () { const field = document.querySelector('input.ng-invalid, textarea.ng-invalid, select.ng-invalid'); if (field) field.focus(); });
        return;
      }
      if (Display.timeValue(vm.event.endModel) <= Display.timeValue(vm.event.startModel)) {
        vm.error = 'End time must be after start time.';
        vm.fields.endModel = vm.error;
        $timeout(function () { document.getElementById('endModel').focus(); });
        return;
      }
      const data = angular.copy(vm.event);
      data.event_date = Display.dateValue(data.dateModel);
      data.start_time = Display.timeValue(data.startModel); data.end_time = Display.timeValue(data.endModel);
      delete data.registrations; delete data.dateModel; delete data.startModel; delete data.endModel;
      vm.saving = true;
      const request = vm.id ? Api.put('/api/admin/events/' + vm.id, data) : Api.post('/api/admin/events', data);
      request.then(function (event) {
        vm.id = String(event.id); unpack(event);
        window.history.replaceState(null, '', Display.path('/admin/event.html?id=' + vm.id));
        vm.message = 'Event saved.'; form.$setPristine(); form.$setUntouched();
      }).catch(function (error) {
        vm.error = error.message; vm.fields = error.fields;
        vm.fields.dateModel = vm.fields.event_date;
        vm.fields.startModel = vm.fields.start_time;
        vm.fields.endModel = vm.fields.end_time;
      })
        .finally(function () { vm.saving = false; });
    };
    vm.load();
  }]);
  app.controller('CategoriesController', ['Api', function (Api) {
    const vm = this;
    vm.categories = []; vm.form = { name: '' };
    vm.load = function () {
      vm.loading = true;
      return Api.get('/api/categories').then(function (rows) { vm.categories = rows; })
        .catch(function (error) { vm.error = error.message; }).finally(function () { vm.loading = false; });
    };
    vm.edit = function (category, form) { vm.form = { id: category.id, name: category.name }; vm.error = ''; vm.message = ''; form.$setPristine(); form.$setUntouched(); };
    vm.cancel = function (form) { vm.form = { name: '' }; vm.error = ''; form.$setPristine(); form.$setUntouched(); };
    vm.save = function (form) {
      if (vm.saving) return;
      vm.error = ''; vm.message = '';
      if (form.$invalid || !vm.form.name.trim()) { vm.error = 'Enter a category name of up to 80 characters.'; return; }
      vm.saving = true;
      const request = vm.form.id ? Api.put('/api/admin/categories/' + vm.form.id, { name: vm.form.name }) : Api.post('/api/admin/categories', { name: vm.form.name });
      request.then(function () { vm.form = { name: '' }; vm.message = 'Category saved.'; form.$setPristine(); form.$setUntouched(); return vm.load(); })
        .catch(function (error) { vm.error = error.message; }).finally(function () { vm.saving = false; });
    };
    vm.deleteCategory = function () {
      if (vm.deleting) return;
      vm.deleting = true; vm.error = ''; vm.message = '';
      Api.remove('/api/admin/categories/' + vm.pendingDelete.id).then(function () { vm.message = 'Category deleted.'; return vm.load(); })
        .catch(function (error) { vm.error = error.message; }).finally(function () { vm.deleting = false; vm.pendingDelete = null; });
    };
    vm.load();
  }]);
}());
