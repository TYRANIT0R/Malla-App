import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div style="
      min-height: 100vh;
      background-color: #f0f2f5;
      display: flex;
      justify-content: center;
      align-items: center;
    ">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent {}
