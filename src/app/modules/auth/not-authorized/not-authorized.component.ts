import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-authorized',
  standalone: true,
  templateUrl: './not-authorized.component.html',
  styleUrl: './not-authorized.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class NotAuthorizedComponent {

}
