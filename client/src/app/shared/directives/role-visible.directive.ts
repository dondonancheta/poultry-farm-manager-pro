import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../core/auth/auth.service';
import { Role } from '../core/models';

/**
 * Structural directive that shows/hides an element based on user role.
 *
 * Usage:
 *   <button *appRoleVisible="['admin', 'manager']">Delete batch</button>
 */
@Directive({
  selector: '[appRoleVisible]',
  standalone: true,
})
export class RoleVisibleDirective {
  private auth = inject(AuthService);
  private vc   = inject(ViewContainerRef);
  private tpl  = inject(TemplateRef<unknown>);

  @Input() set appRoleVisible(roles: Role[]) {
    this.vc.clear();
    if (this.auth.hasRole(...roles)) {
      this.vc.createEmbeddedView(this.tpl);
    }
  }
}
