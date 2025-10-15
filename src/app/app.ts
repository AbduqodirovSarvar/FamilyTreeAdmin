import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {FeaturesModule} from './features/features.module';
import {CoreModule} from './core/core.module';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    FeaturesModule,
    CoreModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'Family Tree Admin';
}
