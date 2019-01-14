import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, ChildActivationEnd, Router } from '@angular/router';
import { AddressBookService } from '../../services/address-book.service';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { WalletService } from '../../services/wallet.service';
import { QLCBlockService } from '../../services/qlc-block.service';
import { AppSettingsService } from '../../services/app-settings.service';
import { PriceService } from '../../services/price.service';
import { UtilService } from '../../services/util.service';
import * as QRCode from 'qrcode';
import BigNumber from 'bignumber.js';
import { RepresentativeService } from '../../services/representative.service';
import { BehaviorSubject } from 'rxjs';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';

@Component({
	selector: 'app-account-details',
	templateUrl: './account-details.component.html',
	styleUrls: ['./account-details.component.scss']
})
export class AccountDetailsComponent implements OnInit, OnDestroy {
	qlc = 100000000;

	msg1 = '';
	msg2 = '';
	msg3 = '';
	msg4 = '';
	msg5 = '';
	msg6 = '';
	msg7 = '';

	accountHistory: any[] = [];
	pendingBlocks = [];
	pageSize = 25;
	maxPageSize = 200;

	repLabel: any = '';
	addressBookEntry: any = null;
	accountMeta: any = {};
	accountId = '';

	walletAccount = null;

	showEditAddressBook = false;
	addressBookTempName = '';
	addressBookModel = '';
	showEditRepresentative = false;
	representativeModel = '';
	representativeResults$ = new BehaviorSubject([]);
	showRepresentatives = false;
	representativeListMatch = '';
	isNaN = isNaN;

	qrCodeImage = null;

	routerSub = null;
	priceSub = null;

	constructor(
		private router: ActivatedRoute,
		private route: Router,
		private addressBook: AddressBookService,
		private api: ApiService,
		private price: PriceService,
		private repService: RepresentativeService,
		private notifications: NotificationService,
		private wallet: WalletService,
		private util: UtilService,
		public settings: AppSettingsService,
		private qlcBlock: QLCBlockService,
		private trans: TranslateService
	) {
		this.loadLang();
	}

	async ngOnInit() {
		this.routerSub = this.route.events.subscribe(event => {
			if (event instanceof ChildActivationEnd) {
				this.loadAccountDetails(); // Reload the state when navigating to itself from the transactions page
			}
		});
		this.priceSub = this.price.lastPrice$.subscribe(event => {
			this.accountMeta.balanceFiat = this.util.qlc
				.rawToMqlc(this.accountMeta.balance || 0)
				.times(this.price.price.lastPrice)
				.toNumber();
			this.accountMeta.pendingFiat = this.util.qlc
				.rawToMqlc(this.accountMeta.pending || 0)
				.times(this.price.price.lastPrice)
				.toNumber();
		});

		await this.loadAccountDetails();
		// console.log(this.accountHistory);
		this.trans.onLangChange.subscribe((event: LangChangeEvent) => {
			this.loadLang();
		});
	}

	loadLang() {
		this.trans.get('ACCOUNT_DETAILS_WARNINGS.msg1').subscribe((res: string) => {
			// console.log(res);
			this.msg1 = res;
		});
		this.trans.get('ACCOUNT_DETAILS_WARNINGS.msg2').subscribe((res: string) => {
			// console.log(res);
			this.msg2 = res;
		});
		this.trans.get('ACCOUNT_DETAILS_WARNINGS.msg3').subscribe((res: string) => {
			// console.log(res);
			this.msg3 = res;
		});
		this.trans.get('ACCOUNT_DETAILS_WARNINGS.msg4').subscribe((res: string) => {
			// console.log(res);
			this.msg4 = res;
		});
		this.trans.get('ACCOUNT_DETAILS_WARNINGS.msg5').subscribe((res: string) => {
			// console.log(res);
			this.msg5 = res;
		});
		this.trans.get('ACCOUNT_DETAILS_WARNINGS.msg6').subscribe((res: string) => {
			// console.log(res);
			this.msg6 = res;
		});
		this.trans.get('ACCOUNT_DETAILS_WARNINGS.msg7').subscribe((res: string) => {
			// console.log(res);
			this.msg7 = res;
		});
	}

	async loadAccountDetails() {
		this.pendingBlocks = [];
		this.accountId = this.router.snapshot.params.account;
		this.addressBookEntry = this.addressBook.getAccountName(this.accountId);
		this.addressBookModel = this.addressBookEntry || '';
		this.walletAccount = this.wallet.getWalletAccount(this.accountId);
		const tokenMap = {};
		const tokens = await this.api.tokens();
		if (!tokens.error) {
			tokens.result.forEach(token => {
				tokenMap[token.tokenId] = token;
			});
		}

		// fill account meta
		const accountInfo = await this.api.accountInfo(this.accountId);
		if (!accountInfo.error) {
			const am = accountInfo.result;
			for (const token of am.tokens) {
				if (tokenMap.hasOwnProperty(token.type)) {
					token.tokenInfo = tokenMap[token.type];
				}
			}
			this.accountMeta = am;
		}

		if (this.accountMeta && this.accountMeta.tokens) {
			this.repLabel = null;
			const filter = this.accountMeta.tokens.filter(token => {
				return token.type === this.api.qlcTokenHash;
			});
			if (filter.length > 0) {
				const knownRepresentative = this.repService.getRepresentative(filter.rep);
				this.repLabel = knownRepresentative ? knownRepresentative.name : null;
			}
		}

		// If there is a pending balance, or the account is not opened yet, load pending transactions
		// if ((!this.accountMeta.error && this.accountMeta.pending > 0) || this.accountMeta.error) {
		const accountPending = await this.api.pending(this.accountId, 25);
		if (!accountPending.error && accountPending.result) {
			const pendingResult = accountPending.result;

			for (const account in pendingResult) {
				if (!pendingResult.hasOwnProperty(account)) {
					continue;
				}
				pendingResult[account].forEach(pending => {
					this.pendingBlocks.push({
						account: pending.pendingInfo.source,
						amount: pending.pendingInfo.amount,
						token: pending.tokenName,
						// TODO: fill timestamp
						// timestamp: accountPending.blocks[block].timestamp,
						addressBookName: this.addressBook.getAccountName(pending.pendingInfo.source) || null,
						hash: pending.hash
					});
				});
			}
		}
		// }

		// If the account doesnt exist, set the pending balance manually
		if (this.accountMeta.error) {
			const pendingRaw = this.pendingBlocks.reduce(
				(prev: BigNumber, current: any) => prev.plus(new BigNumber(current.amount)),
				new BigNumber(0)
			);
			this.accountMeta.pending = pendingRaw;
		}

		// Set fiat values?
		// this.accountMeta.balanceRaw = new BigNumber(this.accountMeta.balance || 0).mod(this.qlc);
		// this.accountMeta.pendingRaw = new BigNumber(this.accountMeta.pending || 0).mod(this.qlc);
		// this.accountMeta.balanceFiat = this.util.qlc
		// 	.rawToMqlc(this.accountMeta.balance || 0)
		// 	.times(this.price.price.lastPrice)
		// 	.toNumber();
		// this.accountMeta.pendingFiat = this.util.qlc
		// 	.rawToMqlc(this.accountMeta.pending || 0)
		// 	.times(this.price.price.lastPrice)
		// 	.toNumber();
		await this.getAccountHistory(this.accountId);

		const qrCode = await QRCode.toDataURL(`${this.accountId}`);
		this.qrCodeImage = qrCode;
	}

	ngOnDestroy() {
		if (this.routerSub) {
			this.routerSub.unsubscribe();
		}
		if (this.priceSub) {
			this.priceSub.unsubscribe();
		}
	}

	async getAccountHistory(account, resetPage = true) {
		if (resetPage) {
			this.pageSize = 25;
		}
		const accountHistory = await this.api.accountHistory(account, this.pageSize);
		// const additionalBlocksInfo = [];

		this.accountHistory = [];
		if (!accountHistory.error) {
			const historyResult = accountHistory.result;
			for (const block of historyResult) {
				// For Open and receive blocks, we need to look up block info to get originating account
				if (block.subType === 'open' || block.subType === 'receive') {
					const preBlock = await this.api.blocksInfo([block.link]);
					if (!preBlock.error) {
						block.link_as_account = preBlock.result[0].address;
					}
				} else {
					block.link_as_account = this.util.account.getPublicAccountID(this.util.hex.toUint8(block.link));
				}
				block.addressBookName = this.addressBook.getAccountName(block.address) || null;
				this.accountHistory.push(block);
			}
			this.accountHistory = this.accountHistory.filter(h => h.subType !== 'change');
		}
	}

	async loadMore() {
		if (this.pageSize <= this.maxPageSize) {
			this.pageSize += 25;
			await this.getAccountHistory(this.accountId, false);
		}
	}

	async saveRepresentative() {
		if (this.wallet.walletIsLocked()) {
			return this.notifications.sendWarning(this.msg1);
		}
		if (!this.walletAccount) {
			return;
		}
		const repAccount = this.representativeModel;

		const valid = await this.api.validateAccountNumber(repAccount);
		if (!valid || !valid.valid) {
			return this.notifications.sendWarning(this.msg2);
		}
		try {
			const changed = await this.qlcBlock.generateChange(this.walletAccount, repAccount, this.wallet.isLedgerWallet());
			if (!changed) {
				this.notifications.sendError(this.msg3);
				return;
			}
		} catch (err) {
			this.notifications.sendError(err.message);
			return;
		}

		// Reload some states, we are successful
		this.representativeModel = '';
		this.showEditRepresentative = false;

		const accountInfo = await this.api.accountInfo(this.accountId);
		if (accountInfo.error) {
			this.repLabel = '';
		} else {
			this.accountMeta = accountInfo.result;
			const newRep = this.repService.getRepresentative(repAccount);
			this.repLabel = newRep ? newRep.name : '';
		}
		this.notifications.sendSuccess(this.msg4);
	}

	async saveAddressBook() {
		const addressBookName = this.addressBookEntry.trim();
		if (!addressBookName) {
			// Check for deleting an entry in the address book
			if (this.addressBookEntry) {
				this.addressBook.deleteAddress(this.accountId);
				this.notifications.sendSuccess(this.msg5);
				this.addressBookEntry = null;
			}

			this.showEditAddressBook = false;
			return;
		}

		try {
			await this.addressBook.saveAddress(this.accountId, addressBookName);
		} catch (err) {
			this.notifications.sendError(err.message);
			return;
		}

		this.notifications.sendSuccess(this.msg6);

		this.addressBookEntry = addressBookName;
		this.showEditAddressBook = false;
	}

	searchRepresentatives() {
		this.showRepresentatives = true;
		const search = this.representativeModel || '';
		const representatives = this.repService.getSortedRepresentatives();

		const matches = representatives.filter(a => a.name.toLowerCase().indexOf(search.toLowerCase()) !== -1).slice(0, 5);

		this.representativeResults$.next(matches);
	}

	selectRepresentative(rep) {
		this.showRepresentatives = false;
		this.representativeModel = rep;
		this.searchRepresentatives();
		this.validateRepresentative();
	}

	validateRepresentative() {
		setTimeout(() => (this.showRepresentatives = false), 400);
		this.representativeModel = this.representativeModel.replace(/ /g, '');
		const rep = this.repService.getRepresentative(this.representativeModel);

		if (rep) {
			this.representativeListMatch = rep.name;
		} else {
			this.representativeListMatch = '';
		}
	}

	copied() {
		this.notifications.sendSuccess(this.msg7);
	}

	editName() {
		this.showEditAddressBook = true;
		this.addressBookTempName = this.addressBookEntry;
	}
	editNameCancel() {
		this.showEditAddressBook = false;
		this.addressBookEntry = this.addressBookTempName;
		this.addressBookTempName = '';
	}
}
