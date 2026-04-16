import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LogsControlComponent } from './shared/components/logs-control/logs-control.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LogsControlComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = 'frontend';
}