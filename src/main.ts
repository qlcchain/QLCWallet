import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { NgxAnalyticsGoogleAnalytics } from '../node_modules/ngx-analytics/ga';

if (environment.production) {
  enableProdMode();
}

NgxAnalyticsGoogleAnalytics.prototype.createGaSession(environment.googleAnalytics);

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
