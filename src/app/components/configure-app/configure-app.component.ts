import { Component, OnInit, TemplateRef } from '@angular/core';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { AppSettingsService } from '../../services/app-settings.service';
import { PriceService } from '../../services/price.service';
import { PowService } from '../../services/pow.service';
import { WorkPoolService } from '../../services/work-pool.service';
import { AddressBookService } from '../../services/address-book.service';
import { ApiService } from '../../services/api.service';
// import { LedgerService, LedgerStatus } from '../../services/ledger.service';
import { LangService } from '../../services/lang.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';

import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import BigNumber from 'bignumber.js';

@Component({
	selector: 'app-configure-app',
	templateUrl: './configure-app.component.html',
	styleUrls: ['./configure-app.component.scss']
})
export class ConfigureAppComponent implements OnInit {
	wallet = this.walletService.wallet;

	msg1 = '';
	msg2 = '';
	msg3 = '';
	msg4 = '';
	msg5 = '';
	msg6 = '';
	msg7 = '';
	msg8 = '';
	msg9 = '';
	msg10 = '';
	msg11 = '';
	msg12 = '';
	msg13 = '';
	msg14 = '';
	msg15 = '';
	msg16 = '';
	msg17 = '';
	msg18 = '';
	msg19 = '';
	msg20 = '';
	msg21 = '';
	msg22 = '';
	msg23 = '';
	msg24 = '';
	msg25 = '';
	msg26 = '';
	msg27 = '';
	msg28 = '';
	msg29 = '';

	denominations = [
		{ name: this.msg1, value: 'mqlc' },
		{ name: this.msg2, value: 'kqlc' },
		{ name: this.msg3, value: 'qlc' }
	];
	selectedDenomination = this.denominations[0].value;

	languages = [{ name: this.msg4, value: 'en' }, { name: this.msg5, value: 'cn' }];
	selectedLang = this.languages[0].value;

	storageOptions = [{ name: this.msg6, value: 'localStorage' }, { name: this.msg7, value: 'none' }];
	selectedStorage = this.storageOptions[0].value;

	currencies = [
		{ name: this.msg8, value: '' },
		{ name: this.msg9, value: 'USD' },
		{ name: this.msg10, value: 'BTC' },
		{ name: this.msg11, value: 'CNY' }
	];
	selectedCurrency = this.currencies[0].value;

	inactivityOptions = [
		{ name: this.msg12, value: 0 },
		{ name: this.msg13, value: 1 },
		{ name: this.msg14, value: 5 },
		{ name: this.msg15, value: 15 },
		{ name: this.msg16, value: 30 },
		{ name: this.msg17, value: 60 },
		{ name: this.msg18, value: 360 }
	];
	selectedInactivityMinutes = this.inactivityOptions[4].value;

	lockOptions = [{ name: this.msg19, value: 1 }, { name: this.msg20, value: 0 }];
	selectedLockOption = 1;

	powOptions = [
		{ name: 'Best Option Available', value: 'best' },
		{ name: 'Client Side - WebGL (Chrome/Firefox)', value: 'clientWebGL' },
		{ name: 'Client Side - CPU', value: 'clientCPU' },
		{ name: 'Server - NanoVault Server', value: 'server' }
	];
	selectedPoWOption = this.powOptions[0].value;

	blockOptions = [{ name: this.msg21, value: false }, { name: this.msg22, value: true }];
	selectedBlockOption = this.blockOptions[0].value;
	langService: LangService;
	modalRef: BsModalRef;

	constructor(
		private walletService: WalletService,
		private notifications: NotificationService,
		private appSettings: AppSettingsService,
		private addressBook: AddressBookService,
		private pow: PowService,
		private api: ApiService,
		// private ledgerService: LedgerService,
		private workPool: WorkPoolService,
		private price: PriceService,
		private lang: LangService,
		private trans: TranslateService,
		private modalService: BsModalService
	) {
		this.langService = lang;
		this.loadLang();
	}

	async ngOnInit() {
		this.loadFromSettings();
		this.trans.onLangChange.subscribe((event: LangChangeEvent) => {
			this.loadLang();
		});
	}

	loadLang() {
		this.trans.get('CONFIGURE_APP_WARNINGS.msg1').subscribe((res: string) => {
			// console.log(res);
			this.msg1 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg2').subscribe((res: string) => {
			// console.log(res);
			this.msg2 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg3').subscribe((res: string) => {
			// console.log(res);
			this.msg3 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg4').subscribe((res: string) => {
			// console.log(res);
			this.msg4 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg5').subscribe((res: string) => {
			// console.log(res);
			this.msg5 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg6').subscribe((res: string) => {
			// console.log(res);
			this.msg6 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg7').subscribe((res: string) => {
			// console.log(res);
			this.msg7 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg8').subscribe((res: string) => {
			// console.log(res);
			this.msg8 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg9').subscribe((res: string) => {
			// console.log(res);
			this.msg9 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg10').subscribe((res: string) => {
			// console.log(res);
			this.msg10 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg11').subscribe((res: string) => {
			// console.log(res);
			this.msg11 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg12').subscribe((res: string) => {
			// console.log(res);
			this.msg12 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg13').subscribe((res: string) => {
			// console.log(res);
			this.msg13 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg14').subscribe((res: string) => {
			// console.log(res);
			this.msg14 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg15').subscribe((res: string) => {
			// console.log(res);
			this.msg15 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg16').subscribe((res: string) => {
			// console.log(res);
			this.msg16 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg17').subscribe((res: string) => {
			// console.log(res);
			this.msg17 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg18').subscribe((res: string) => {
			// console.log(res);
			this.msg18 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg19').subscribe((res: string) => {
			// console.log(res);
			this.msg19 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg20').subscribe((res: string) => {
			// console.log(res);
			this.msg20 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg21').subscribe((res: string) => {
			// console.log(res);
			this.msg21 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg22').subscribe((res: string) => {
			// console.log(res);
			this.msg22 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg23').subscribe((res: string) => {
			// console.log(res);
			this.msg23 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg24').subscribe((res: string) => {
			// console.log(res);
			this.msg24 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg25').subscribe((res: string) => {
			// console.log(res);
			this.msg25 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg26').subscribe((res: string) => {
			// console.log(res);
			this.msg26 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg27').subscribe((res: string) => {
			// console.log(res);
			this.msg27 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg28').subscribe((res: string) => {
			// console.log(res);
			this.msg28 = res;
		});
		this.trans.get('CONFIGURE_APP_WARNINGS.msg29').subscribe((res: string) => {
			// console.log(res);
			this.msg29 = res;
		});
		this.denominations = [
			{ name: this.msg1, value: 'mqlc' },
			{ name: this.msg2, value: 'kqlc' },
			{ name: this.msg3, value: 'qlc' }
		];

		this.languages = [{ name: this.msg4, value: 'en' }, { name: this.msg5, value: 'cn' }];

		this.storageOptions = [{ name: this.msg6, value: 'localStorage' }, { name: this.msg7, value: 'none' }];

		this.currencies = [
			{ name: this.msg8, value: '' },
			{ name: this.msg9, value: 'USD' },
			{ name: this.msg10, value: 'BTC' },
			{ name: this.msg11, value: 'CNY' }
		];

		this.inactivityOptions = [
			{ name: this.msg12, value: 0 },
			{ name: this.msg13, value: 1 },
			{ name: this.msg14, value: 5 },
			{ name: this.msg15, value: 15 },
			{ name: this.msg16, value: 30 },
			{ name: this.msg17, value: 60 },
			{ name: this.msg18, value: 360 }
		];

		this.lockOptions = [{ name: this.msg19, value: 1 }, { name: this.msg20, value: 0 }];

		this.powOptions = [
			{ name: 'Best Option Available', value: 'best' },
			{ name: 'Client Side - WebGL (Chrome/Firefox)', value: 'clientWebGL' },
			{ name: 'Client Side - CPU', value: 'clientCPU' },
			{ name: 'Server - NanoVault Server', value: 'server' }
		];

		this.blockOptions = [{ name: this.msg21, value: false }, { name: this.msg22, value: true }];
	}

	loadFromSettings() {
		const settings = this.appSettings.settings;

		const matchingLang = this.languages.find(d => d.value === settings.lang);
		this.selectedLang = matchingLang.value || this.languages[0].value;

		const matchingCurrency = this.currencies.find(d => d.value === settings.displayCurrency);
		this.selectedCurrency = matchingCurrency.value || this.currencies[0].value;

		const matchingDenomination = this.denominations.find(d => d.value === settings.displayDenomination);
		this.selectedDenomination = matchingDenomination.value || this.denominations[0].value;

		const matchingStorage = this.storageOptions.find(d => d.value === settings.walletStore);
		this.selectedStorage = matchingStorage.value || this.storageOptions[0].value;

		const matchingInactivityMinutes = this.inactivityOptions.find(d => d.value === settings.lockInactivityMinutes);
		this.selectedInactivityMinutes = matchingInactivityMinutes
			? matchingInactivityMinutes.value
			: this.inactivityOptions[4].value;

		const matchingLockOption = this.lockOptions.find(d => d.value === settings.lockOnClose);
		this.selectedLockOption = matchingLockOption ? matchingLockOption.value : this.lockOptions[0].value;

		const matchingPowOption = this.powOptions.find(d => d.value === settings.powSource);
		this.selectedPoWOption = matchingPowOption ? matchingPowOption.value : this.powOptions[0].value;
	}

	async updateAppSettings() {
		const newStorage = this.selectedStorage;
		const resaveWallet = this.appSettings.settings.walletStore !== newStorage;
		const newCurrency = this.selectedCurrency;
		const reloadFiat = this.appSettings.settings.displayCurrency !== newCurrency;
		const newLang = this.selectedLang;
		const reloadLang = this.appSettings.settings.lang !== newLang;

		const newSettings = {
			walletStore: newStorage,
			lockOnClose: this.selectedLockOption,
			lockInactivityMinutes: this.selectedInactivityMinutes,
			displayDenomination: this.selectedDenomination,
			lang: newLang
		};
		// console.log(newSettings);
		this.appSettings.setAppSettings(newSettings);
		this.notifications.sendSuccess(this.msg23);

		if (reloadLang) {
			this.langService.changeLang(newLang); // If swapping the storage engine, resave the wallet
		}

		if (resaveWallet) {
			this.walletService.saveWalletExport(); // If swapping the storage engine, resave the wallet
		}
		if (reloadFiat) {
			// Reload prices with our currency, then call to reload fiat balances.
			await this.price.getPrice(newCurrency);
			this.appSettings.setAppSetting('displayCurrency', newCurrency);
			this.walletService.reloadFiatBalances();
		}
	}

	openModal(template: TemplateRef<any>) {
		// this.modalRef = this.modalService.show(template, {class: 'modal-sm'});
		this.modalRef = this.modalService.show(template);
	}

	async clearWorkCache() {
		try {
			this.workPool.clearCache();
			this.notifications.sendSuccess(this.msg25);
			this.modalRef.hide();
		} catch (err) {}
	}

	async clearAllWalletData() {
		try {
			this.walletService.resetWallet();
			this.walletService.removeWalletData();

			this.notifications.sendSuccess(this.msg27);
			this.modalRef.hide();
		} catch (err) {}
	}

	async clearWalletData() {
		// const UIkit = window['UIkit'];
		try {
			// const confirmMessage = this.msg26;
			// await UIkit.modal.confirm(confirmMessage);
			this.walletService.resetWallet();
			this.walletService.removeWalletData();

			this.notifications.sendSuccess(this.msg27);
		} catch (err) {}
	}

	async clearAll() {
		try {
			this.walletService.resetWallet();
			this.walletService.removeWalletData();

			this.workPool.deleteCache();
			this.addressBook.clearAddressBook();
			this.appSettings.clearAppSettings();

			this.loadFromSettings();

			this.notifications.sendSuccess(this.msg29);
			this.modalRef.hide();
		} catch (err) {}
	}

	async clearAllData() {
		// const UIkit = window['UIkit'];
		try {
			// const confirmMessage = this.msg28;
			// await UIkit.modal.confirm(confirmMessage);
			this.walletService.resetWallet();
			this.walletService.removeWalletData();

			this.workPool.deleteCache();
			this.addressBook.clearAddressBook();
			this.appSettings.clearAppSettings();

			this.loadFromSettings();

			this.notifications.sendSuccess(this.msg29);
		} catch (err) {}
	}
}
