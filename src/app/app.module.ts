import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ClipboardModule } from 'ngx-clipboard';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AlertModule } from 'ngx-bootstrap/alert';
import { DeviceDetectorModule } from 'ngx-device-detector';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';

import { environment } from '../environments/environment';

// routing
import { AppRoutingModule } from './app-routing.module';

// components
import { AppComponent } from './app.component';
import { NavComponent } from './components/nav/nav.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { ConfigureWalletComponent } from './components/configure-wallet/configure-wallet.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { AccountsComponent } from './components/accounts/accounts.component';
import { AccountDetailsComponent } from './components/account-details/account-details.component';
import { AddressBookComponent } from './components/address-book/address-book.component';
import { SendComponent } from './components/send/send.component';
import { ReceiveComponent } from './components/receive/receive.component';
import { WalletWidgetComponent } from './components/wallet-widget/wallet-widget.component';
import { ManageWalletComponent } from './components/manage-wallet/manage-wallet.component';
import { ConfigureAppComponent } from './components/configure-app/configure-app.component';
import { TransactionDetailsComponent } from './components/transaction-details/transaction-details.component';
import { ImportWalletComponent } from './components/import-wallet/import-wallet.component';
import { QlcAccountIdComponent } from './components/helpers/qlc-account-id/qlc-account-id.component';
import { ImportAddressBookComponent } from './components/import-address-book/import-address-book.component';
import { RepresentativesComponent } from './components/representatives/representatives.component';
import { ManageRepresentativesComponent } from './components/manage-representatives/manage-representatives.component';
import { FooterComponent } from './components/footer/footer.component';

// pipes
import { QlcPipe } from './pipes/qlc.pipe';
import { SqueezePipe } from './pipes/squeeze.pipe';
import { FiatPipe } from './pipes/fiat.pipe';
import { CurrencySymbolPipe } from './pipes/currency-symbol.pipe';
// directives
import { AutofocusDirective } from './directives/autofocus.directive';

export function HttpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
	declarations: [
		AppComponent,
		WelcomeComponent,
		ConfigureWalletComponent,
		NotificationsComponent,
		QlcPipe,
		SqueezePipe,
		AccountsComponent,
		SendComponent,
		AddressBookComponent,
		ReceiveComponent,
		WalletWidgetComponent,
		ManageWalletComponent,
		ConfigureAppComponent,
		AccountDetailsComponent,
		TransactionDetailsComponent,
		FiatPipe,
		ImportWalletComponent,
		QlcAccountIdComponent,
		ImportAddressBookComponent,
		CurrencySymbolPipe,
		RepresentativesComponent,
		ManageRepresentativesComponent,
		NavComponent,
		FooterComponent,
		AutofocusDirective
	],
	imports: [
		BrowserModule,
		HttpClientModule,
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient]
			}
		}),
		AppRoutingModule,
		ReactiveFormsModule,
		FormsModule,
		ClipboardModule,
		TooltipModule.forRoot(),
		BsDropdownModule.forRoot(),
		CollapseModule.forRoot(),
		ModalModule.forRoot(),
		AlertModule.forRoot(),
		DeviceDetectorModule.forRoot(),
		LoggerModule.forRoot({
			serverLoggingUrl: `${environment.apiUrl}/logs`,
			// serverLoggingUrl: `http://localhost:8888/logs`,
			level: NgxLoggerLevel.DEBUG,
			serverLogLevel: NgxLoggerLevel.ERROR
		})
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {}
