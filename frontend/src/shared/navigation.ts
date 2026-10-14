import { Directive, HostBinding, Input } from '@angular/core';
/** Fragment links must stay on the current route despite the application's base URL. */
@Directive({ selector: 'a[localAnchor]' })
export class LocalAnchor {
  @Input() localAnchor = '';
  @HostBinding('attr.href') get href(): string {
    return location.pathname + location.search + this.localAnchor;
  }
}
