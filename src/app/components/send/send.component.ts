import { Component, OnInit } from '@angular/core';
import BigNumber from 'bignumber.js';
import { AddressBookService } from '../../services/address-book.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { ApiService } from '../../services/api.service';
import { UtilService } from '../../services/util.service';

import * as blake from 'blakejs';
import { WorkPoolService } from '../../services/work-pool.service';
import { AppSettingsService } from '../../services/app-settings.service';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { PriceService } from '../../services/price.service';
import { QLCBlockService } from '../../services/qlc-block.service';
import { ValueTransformer } from '@angular/compiler/src/util';

const nacl = window['nacl'];

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.scss']
})
export class SendComponent implements OnInit {
  qlc = 100000000;

  activePanel = 'send';

  accounts = this.walletService.wallet.accounts;
  accountTokens: any = [];
  selectedToken: any = [];
  selectedTokenSymbol = '';
  addressBookResults$ = new BehaviorSubject([]);
  showAddressBook = false;
  addressBookMatch = '';

  amounts = [
    { name: 'QLC (1 Mqlc)', shortName: 'QLC', value: 'mqlc' },
    { name: 'kqlc (0.001 Mqlc)', shortName: 'kqlc', value: 'kqlc' },
    { name: 'qlc (0.000001 Mqlc)', shortName: 'qlc', value: 'qlc' },
  ];

  selectedAmount = this.amounts[0];

  amount = null;
  amountRaw = new BigNumber(0);
  amountFiat: number | null = null;
  rawAmount: BigNumber = new BigNumber(0);
  fromAccount: any = {};
  fromAccountID: any = '';
  fromAddressBook = '';
  // toAccount: any = false;
  toAccountID = '';
  bookContact = '';
  toAddressBook = '';
  toAccountStatus = null;
  confirmingTransaction = false;

  constructor(
    private router: ActivatedRoute,
    private walletService: WalletService,
    private addressBookService: AddressBookService,
    private notificationService: NotificationService,
    private api: ApiService,
    private qlcBlock: QLCBlockService,
    public price: PriceService,
    private workPool: WorkPoolService,
    public settings: AppSettingsService,
    private util: UtilService) {
    console.log(this.accounts);
    // this.accountTokens = this.accounts[0].account_info.account_infos;
    // this.selectedToken = this.accountTokens[0];
    console.log(this.accountTokens);
    console.log(this.selectedToken);
    if (this.accounts !== undefined && this.accounts.length > 0) {
      this.searchAddressBook();

    }
    this.loadBalances();
  }
  async loadBalances() {
    console.log('loading balances');
    for (let i = 0; i < this.accounts.length; i++) {
      console.log(this.accounts[i]);
      this.accounts[i].account_info = await this.api.accountInfo(this.accounts[i].id);
    }

    // this.accountTokens = ((this.accounts != undefined && this.accounts.length > 0) ? this.accounts[0] : []);
    // this.selectedToken = ((this.accountTokens != undefined && this.accountTokens.length > 0) ? this.accountTokens[0] : []);
    // this.selectedTokenSymbol = ((this.selectedToken != undefined && this.selectedToken.symbol != undefined) ? this.selectedToken.symbol : '');
    // walletAccount.account_info = await this.api.accountInfo(accountID);
    this.selectAccount();
  }

  async ngOnInit() {
    const params = this.router.snapshot.queryParams;
    if (params && params.amount) {
      this.amount = params.amount;
    }
    if (params && params.to) {
      this.toAccountID = params.to;
      this.validateDestination();
    }

    this.addressBookService.loadAddressBook();
    // Look for the first account that has a balance
    const accountIDWithBalance = this.accounts.reduce((previous, current) => {
      if (previous) {
        return previous;
      } else if (current.balance.gt(0)) {
        return current.id;
      } else {
        return null;
      }
    }, null);

    if (accountIDWithBalance) {
      this.fromAccountID = accountIDWithBalance;
    } else {
      this.fromAccountID = this.accounts.length ? this.accounts[0].id : '';
    }
  }

  // An update to the Nano amount, sync the fiat value
  syncFiatPrice() {
    const rawAmount = this.getAmountBaseValue(this.amount || 0).plus(this.amountRaw);
    if (rawAmount.lte(0)) {
      this.amountFiat = 0;
      return;
    }

    // This is getting hacky, but if their currency is bitcoin, use 6 decimals, if it is not, use 2
    const precision = this.settings.settings.displayCurrency === 'BTC' ? 1000000 : 100;

    // Determine fiat value of the amount
    const fiatAmount = this.util.qlc.rawToMqlc(rawAmount)
      .times(this.price.price.lastPrice).times(precision).floor().div(precision).toNumber();
    this.amountFiat = fiatAmount;
  }

  // An update to the fiat amount, sync the nano value based on currently selected denomination
  syncNanoPrice() {
    const fiatAmount = this.amountFiat || 0;
    const rawAmount = this.util.qlc.mqlcToRaw(new BigNumber(fiatAmount).div(this.price.price.lastPrice));
    const nanoVal = this.util.qlc.rawToQlc(rawAmount).floor();
    const nanoAmount = this.getAmountValueFromBase(this.util.qlc.qlcToRaw(nanoVal));

    this.amount = nanoAmount.toNumber();
  }

  searchAddressBook() {
    this.showAddressBook = true;
    const search = this.toAccountID || '';
    const addressBook = this.addressBookService.addressBook;

    const matches = addressBook
      .filter(a => a.name.toLowerCase().indexOf(search.toLowerCase()) !== -1)
      .slice(0, 5);

    this.addressBookResults$.next(matches);
  }

  selectBookEntry(account) {
    this.showAddressBook = false;
    this.toAccountID = account;
    this.searchAddressBook();
    this.validateDestination();
  }

  async validateDestination() {
    // The timeout is used to solve a bug where the results get hidden too fast and the click is never registered
    setTimeout(() => this.showAddressBook = false, 400);

    // Remove spaces from the account id
    this.toAccountID = this.toAccountID.replace(/ /g, '');

    this.addressBookMatch = this.addressBookService.getAccountName(this.toAccountID);

    // const accountInfo = await this.walletService.walletApi.accountInfo(this.toAccountID);
    const accountInfo = await this.api.accountInfo(this.toAccountID);
    if (accountInfo.error) {
      if (accountInfo.error === 'Account not found') {
        this.toAccountStatus = 1;
      } else {
        this.toAccountStatus = 0;
      }
    }
    if (accountInfo && accountInfo.frontier) {
      this.toAccountStatus = 2;
    }
  }

  async sendTransaction() {
    const isValid = await this.api.validateAccountNumber(this.toAccountID);
    if (!isValid || isValid.valid === '0') {
      return this.notificationService.sendWarning(`To account address is not valid`);
    }
    if (!this.fromAccountID || !this.toAccountID) {
      return this.notificationService.sendWarning(`From and to account are required`);
    }

    const from = await this.api.accountInfoByToken(this.fromAccountID, this.selectedToken.token_hash);
    // let to = await this.api.accountInfoByToken(this.toAccountID, this.selectedToken.token_hash);
    if (!from) {
      return this.notificationService.sendError(`From account not found`);
    }
    if (this.fromAccountID === this.toAccountID) {
      return this.notificationService.sendWarning(`From and to account cannot be the same`);
    }

    // if (!to) {
    //   console.log('to account does not exit ');
    //   to = {};
    // }
    from.balanceBN = new BigNumber(from.balance || 0);
    // to.balanceBN = new BigNumber(to.balance || 0);
    this.fromAccount = from;
    // this.toAccount = to;

    // to be transfered amount
    const rawAmount = this.getAmountBaseValue(this.amount || 0);
    this.rawAmount = rawAmount.plus(this.amountRaw);

    const qlcAmount = this.rawAmount.div(this.qlc);

    if (this.amount < 0 || rawAmount.lessThan(0)) {
      return this.notificationService.sendWarning(`Amount is invalid`);
    }
    if (qlcAmount.lessThan(1)) {
      const warnMessage = `Transactions for less than 1 qlc will be ignored by the node.  Send raw amounts with at least 1 qlc.`;
      return this.notificationService.sendWarning(warnMessage);
    }
    if (from.balanceBN.minus(rawAmount).lessThan(0)) {
      return this.notificationService.sendError(`From account does not have enough ${this.selectedToken.token}`);
    }

    // Determine a proper raw amount to show in the UI, if a decimal was entered
    this.amountRaw = this.rawAmount.mod(this.qlc);

    // Determine fiat value of the amount
    this.amountFiat = this.util.qlc.rawToMqlc(rawAmount).times(this.price.price.lastPrice).toNumber();

    // Start precopmuting the work...
    this.fromAddressBook = this.addressBookService.getAccountName(this.fromAccountID);
    this.toAddressBook = this.addressBookService.getAccountName(this.toAccountID);
    this.workPool.addWorkToCache(this.fromAccount.frontier);

    this.activePanel = 'confirm';
  }

  async confirmTransaction() {
    const walletAccount = this.walletService.wallet.accounts.find(a => a.id === this.fromAccountID);
    if (!walletAccount) {
      throw new Error(`Unable to find sending account in wallet`);
    }
    if (this.walletService.walletIsLocked()) {
      return this.notificationService.sendWarning(`Wallet must be unlocked`);
    }

    this.confirmingTransaction = true;

    try {
      const newHash = await this.qlcBlock.generateSend(walletAccount, this.toAccountID, this.selectedToken.token_hash, this.rawAmount,
        this.walletService.isLedgerWallet());
      if (newHash) {
        this.notificationService.sendSuccess(`Successfully sent ${this.amount} ${this.selectedToken.token}!`);
        this.activePanel = 'send';
        this.amount = null;
        this.amountFiat = null;
        this.resetRaw();
        this.toAccountID = '';
        this.toAccountStatus = null;
        this.fromAddressBook = '';
        this.toAddressBook = '';
        this.addressBookMatch = '';
      } else {
        if (!this.walletService.isLedgerWallet()) {
          const errMessage = `There was an error sending your transaction, please try again.`;
          this.notificationService.sendError(errMessage);
        }
      }
    } catch (err) {
      const errMessage = `There was an error sending your transaction: ${err.message}`;
      this.notificationService.sendError(errMessage);
    }

    this.confirmingTransaction = false;

    await this.walletService.reloadBalances();
  }

  setMaxAmount() {
    const walletAccount = this.walletService.wallet.accounts.find(a => a.id === this.fromAccountID);
    if (!walletAccount) {
      return;
    }

    this.amountRaw = this.selectedToken.balance;

    const tokenVal = this.util.qlc.rawToQlc(this.amountRaw).floor();
    const maxAmount = this.getAmountValueFromBase(this.util.qlc.qlcToRaw(tokenVal));
    this.amount = maxAmount.toNumber();
    this.syncFiatPrice();
  }

  resetRaw() {
    console.log('resetraw');
    this.amountRaw = new BigNumber(0);
    this.amount = '';
  }

  selectToken() {
    console.log('selectToken');
    console.log(this.selectedTokenSymbol);
    if (this.accountTokens !== undefined && this.accountTokens.length > 0) {
      this.selectedToken = this.accountTokens.find(a => a.symbol === this.selectedTokenSymbol);
    } else {
      this.selectedToken = '';
    }
    this.resetRaw();
  }

  selectAccount() {
    console.log('selectAccount');
    const selectedAccount = this.accounts.find(a => a.id === this.fromAccountID);
    this.accountTokens = selectedAccount.account_info.account_infos;
    this.selectedToken = ((this.accountTokens !== undefined && this.accountTokens.length > 0) ? this.accountTokens[0] : {});
    this.selectedTokenSymbol = ((this.selectedToken !== undefined
      && this.selectedToken.symbol !== undefined) ? this.selectedToken.symbol : '');
    this.resetRaw();
  }

  selectFromBook() {
    this.toAccountID = this.bookContact;
  }

  getAmountBaseValue(value) {

    switch (this.selectedAmount.value) {
      default:
      case 'qlc': return this.util.qlc.qlcToRaw(value);
      case 'kqlc': return this.util.qlc.kqlcToRaw(value);
      case 'mqlc': return this.util.qlc.mqlcToRaw(value);
    }
  }

  getAmountValueFromBase(value) {
    switch (this.selectedAmount.value) {
      default:
      case 'qlc': return this.util.qlc.rawToQlc(value);
      case 'kqlc': return this.util.qlc.rawToKqlc(value);
      case 'mqlc': return this.util.qlc.rawToMqlc(value);
    }
  }

}
