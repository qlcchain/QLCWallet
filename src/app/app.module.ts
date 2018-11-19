import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { LangService } from './services/lang.service';

import { AppComponent } from './app.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WelcomeComponent } from './welcome/welcome.component';
import { AppRoutingModule } from './app-routing.module';
import { UtilService } from './services/util.service';
import { WalletService } from './services/wallet.service';
import { ConfigureWalletComponent } from './components/configure-wallet/configure-wallet.component';
import { NotificationService } from './services/notification.service';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { QlcPipe } from './pipes/qlc.pipe';
import { AccountsComponent } from './components/accounts/accounts.component';
import { ApiService } from './services/api.service';
import { AddressBookService } from './services/address-book.service';
import { SendComponent } from './components/send/send.component';
import { SqueezePipe } from './pipes/squeeze.pipe';
import { ModalService } from './services/modal.service';
import { AddressBookComponent } from './components/address-book/address-book.component';
import { ClipboardModule } from 'ngx-clipboard';
import { ReceiveComponent } from './components/receive/receive.component';
import { WalletWidgetComponent } from './components/wallet-widget/wallet-widget.component';
import { ManageWalletComponent } from './components/manage-wallet/manage-wallet.component';
import { WorkPoolService } from './services/work-pool.service';
import { ConfigureAppComponent } from './components/configure-app/configure-app.component';
import { AppSettingsService } from './services/app-settings.service';

import { WebsocketService } from './services/websocket.service';
import { QLCBlockService } from './services/qlc-block.service';
import { AccountDetailsComponent } from './components/account-details/account-details.component';
import { TransactionDetailsComponent } from './components/transaction-details/transaction-details.component';
import { PriceService } from './services/price.service';
import { FiatPipe } from './pipes/fiat.pipe';
import { ImportWalletComponent } from './components/import-wallet/import-wallet.component';
import { QlcAccountIdComponent } from './components/helpers/qlc-account-id/qlc-account-id.component';
import { PowService } from './services/pow.service';
import { ImportAddressBookComponent } from './components/import-address-book/import-address-book.component';
import { CurrencySymbolPipe } from './pipes/currency-symbol.pipe';
import { RepresentativesComponent } from './components/representatives/representatives.component';
import { RepresentativeService } from './services/representative.service';
import { ManageRepresentativesComponent } from './components/manage-representatives/manage-representatives.component';
import { NodeService } from './services/node.service';
import { LedgerService } from './services/ledger.service';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AlertModule } from 'ngx-bootstrap/alert';
import { NavComponent } from './components/nav/nav.component';
import { DeviceDetectorModule } from 'ngx-device-detector';

import { NgxAnalyticsModule } from 'ngx-analytics';
import { NgxAnalyticsGoogleAnalytics } from 'ngx-analytics/ga';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { environment } from '../environments/environment';
import { FooterComponent } from './components/footer/footer.component';
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
		NgxAnalyticsModule.forRoot([NgxAnalyticsGoogleAnalytics]),
		LoggerModule.forRoot({
			serverLoggingUrl: `${environment.apiUrl}/logs`,
			// serverLoggingUrl: `http://localhost:8888/logs`,
			level: NgxLoggerLevel.DEBUG,
			serverLogLevel: NgxLoggerLevel.ERROR
		})
	],
	providers: [
		LangService,
		UtilService,
		WalletService,
		NotificationService,
		ApiService,
		AddressBookService,
		ModalService,
		WorkPoolService,
		AppSettingsService,
		WebsocketService,
		QLCBlockService,
		PriceService,
		PowService,
		RepresentativeService,
		NodeService,
		LedgerService
	],
	bootstrap: [AppComponent]
})
export class AppModule {}
