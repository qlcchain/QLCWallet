import { Component, OnInit } from '@angular/core';
import {WalletService} from "../../services/wallet.service";
import {NotificationService} from "../../services/notification.service";
import {AppSettingsService} from "../../services/app-settings.service";
import {PriceService} from "../../services/price.service";
import {PowService} from "../../services/pow.service";
import {WorkPoolService} from "../../services/work-pool.service";
import {AddressBookService} from "../../services/address-book.service";
import {ApiService} from "../../services/api.service";
import {LedgerService, LedgerStatus} from "../../ledger.service";
import {LangService} from "../../services/lang.service";
import BigNumber from "bignumber.js";

@Component({
  selector: 'app-configure-app',
  templateUrl: './configure-app.component.html',
  styleUrls: ['./configure-app.component.scss']
})
export class ConfigureAppComponent implements OnInit {
  wallet = this.walletService.wallet;

  denominations = [
    { name: 'NANO (1 Mnano)', value: 'mnano' },
    { name: 'knano (0.001 Mnano)', value: 'knano' },
    { name: 'nano (0.000001 Mnano)', value: 'nano' },
  ];
  selectedDenomination = this.denominations[0].value;

  languages = [
    { name: 'English', value: 'en' },
    { name: 'Chinese', value: 'cn' }
  ];
  selectedLang = this.languages[0].value;

  storageOptions = [
    { name: 'Browser Local Storage', value: 'localStorage' },
    { name: 'None', value: 'none' },
  ];
  selectedStorage = this.storageOptions[0].value;

  currencies = [
    { name: 'None', value: '' },
    { name: 'USD - US Dollar', value: 'USD' },
    { name: 'BTC - Bitcoin', value: 'BTC' },
    { name: 'CNY - Chinese Yuan', value: 'CNY' }
  ];
  selectedCurrency = this.currencies[0].value;

  inactivityOptions = [
    { name: 'Never', value: 0 },
    { name: '1 Minute', value: 1 },
    { name: '5 Minutes', value: 5 },
    { name: '15 Minutes', value: 15 },
    { name: '30 Minutes', value: 30 },
    { name: '1 Hour', value: 60 },
    { name: '6 Hours', value: 360 },
  ];
  selectedInactivityMinutes = this.inactivityOptions[4].value;

  lockOptions = [
    { name: 'Lock Wallet On Close', value: 1 },
    { name: 'Do Not Lock Wallet On Close', value: 0 },
  ];
  selectedLockOption = 1;

  powOptions = [
    { name: 'Best Option Available', value: 'best' },
    { name: 'Client Side - WebGL (Chrome/Firefox)', value: 'clientWebGL' },
    { name: 'Client Side - CPU', value: 'clientCPU' },
    { name: 'Server - NanoVault Server', value: 'server' },
  ];
  selectedPoWOption = this.powOptions[0].value;

  blockOptions = [
    { name: 'Legacy Blocks', value: false },
    { name: 'State Blocks', value: true },
  ];
  selectedBlockOption = this.blockOptions[0].value;
  langService: LangService;

  constructor(
    private walletService: WalletService,
    private notifications: NotificationService,
    private appSettings: AppSettingsService,
    private addressBook: AddressBookService,
    private pow: PowService,
    private api: ApiService,
    private ledgerService: LedgerService,
    private workPool: WorkPoolService,
    private price: PriceService,
    private lang:LangService) { 
      this.langService = lang;
    }

  async ngOnInit() {
    this.loadFromSettings();
  }

  loadFromSettings() {
    const settings = this.appSettings.settings;

    const matchingLang = this.languages.find(d => d.value === settings.lang);
    this.selectedLang = matchingLang.value || this.languages[0].value;

    const matchingCurrency = this.currencies.find(d => d.value === settings.displayCurrency);
    this.selectedCurrency = matchingCurrency.value || this.currencies[0].value;

    const matchingDenomination = this.denominations.find(d => d.value == settings.displayDenomination);
    this.selectedDenomination = matchingDenomination.value || this.denominations[0].value;

    const matchingStorage = this.storageOptions.find(d => d.value == settings.walletStore);
    this.selectedStorage = matchingStorage.value || this.storageOptions[0].value;

    const matchingInactivityMinutes = this.inactivityOptions.find(d => d.value == settings.lockInactivityMinutes);
    this.selectedInactivityMinutes = matchingInactivityMinutes ? matchingInactivityMinutes.value : this.inactivityOptions[4].value;

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
      lockOnClose: new Number(this.selectedLockOption),
      lockInactivityMinutes: new Number(this.selectedInactivityMinutes),
      displayDenomination: this.selectedDenomination,
      lang: newLang
    };

    this.appSettings.setAppSettings(newSettings);
    this.notifications.sendSuccess(`App settings successfully updated!`);

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

  async clearWorkCache() {
    const UIkit = window['UIkit'];
    try {
      await UIkit.modal.confirm('<p style="text-align: center;">You are about to delete all locally cached Proof of Work values<br><br><b>Are you sure?</b></p>');
      this.workPool.clearCache();
      this.notifications.sendSuccess(`Successfully cleared the work cache!`);
    } catch (err) {}
  }

  async clearWalletData() {
    const UIkit = window['UIkit'];
    try {
      await UIkit.modal.confirm('<p style="text-align: center;">You are about to delete all of your wallet data stored in NanoVault!<br><b>Make sure you have your seed backed up!!</b><br><br><b>Are you sure?</b></p>');
      this.walletService.resetWallet();
      this.walletService.removeWalletData();

      this.notifications.sendSuccess(`Successfully deleted all wallet data!`);
    } catch (err) {}
  }

  async clearAllData() {
    const UIkit = window['UIkit'];
    try {
      await UIkit.modal.confirm('<p style="text-align: center;">You are about to delete ALL of your data stored in NanoVault.<br>This includes all of your wallet data, your address book, and your application settings!<br><br><b>Make sure you have your seed backed up!!</b><br><br><b>Are you sure?</b></p>');
      this.walletService.resetWallet();
      this.walletService.removeWalletData();

      this.workPool.deleteCache();
      this.addressBook.clearAddressBook();
      this.appSettings.clearAppSettings();

      this.loadFromSettings();

      this.notifications.sendSuccess(`Successfully deleted ALL locally stored data!`);
    } catch (err) {}
  }
}
