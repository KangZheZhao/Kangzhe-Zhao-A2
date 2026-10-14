import { Component, ChangeDetectionStrategy, provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, RouterOutlet, withInMemoryScrolling } from '@angular/router';
import { AboutComponent } from './about';
import { EventComponent } from './event';
import { HomeComponent } from './index';
import { RegistrationComponent } from './registration';
import { SearchComponent } from './search';
@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class App {}
bootstrapApplication(App, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideRouter(
      [
        { path: '', component: HomeComponent, pathMatch: 'full' },
        { path: 'about.html', component: AboutComponent },
        { path: 'event.html', component: EventComponent },
        { path: 'index.html', component: HomeComponent },
        { path: 'registration.html', component: RegistrationComponent },
        { path: 'search.html', component: SearchComponent },
      ],
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
  ],
}).catch(() => {
  const root = document.querySelector('app-root');
  if (root) root.textContent = 'The page could not be loaded. Refresh and try again.';
});
