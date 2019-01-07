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
	accountID = '';

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
		this.accountID = this.router.snapshot.params.account;
		this.addressBookEntry = this.addressBook.getAccountName(this.accountID);
		this.addressBookModel = this.addressBookEntry || '';
		this.walletAccount = this.wallet.getWalletAccount(this.accountID);
		this.accountMeta = await this.api.accountInfo(this.accountID);

		const knownRepresentative = this.repService.getRepresentative(this.accountMeta.representative);
		this.repLabel = knownRepresentative ? knownRepresentative.name : null;

		// If there is a pending balance, or the account is not opened yet, load pending transactions
		// FIXME:
		if ((!this.accountMeta.error && this.accountMeta.pending > 0) || this.accountMeta.error) {
			const pending = await this.api.pending(this.accountID, 25);
			if (pending && pending.blocks) {
				for (const block in pending.blocks) {
					if (!pending.blocks.hasOwnProperty(block)) {
						continue;
					}
					this.pendingBlocks.push({
						account: pending.blocks[block].source,
						amount: pending.blocks[block].amount,
						timestamp: pending.blocks[block].timestamp,
						addressBookName: this.addressBook.getAccountName(pending.blocks[block].source) || null,
						hash: block
					});
				}
			}
		}

		// If the account doesnt exist, set the pending balance manually
		if (this.accountMeta.error) {
			const pendingRaw = this.pendingBlocks.reduce(
				(prev: BigNumber, current: any) => prev.plus(new BigNumber(current.amount)),
				new BigNumber(0)
			);
			this.accountMeta.pending = pendingRaw;
		}

		// Set fiat values?
		this.accountMeta.balanceRaw = new BigNumber(this.accountMeta.balance || 0).mod(this.qlc);
		this.accountMeta.pendingRaw = new BigNumber(this.accountMeta.pending || 0).mod(this.qlc);
		this.accountMeta.balanceFiat = this.util.qlc
			.rawToMqlc(this.accountMeta.balance || 0)
			.times(this.price.price.lastPrice)
			.toNumber();
		this.accountMeta.pendingFiat = this.util.qlc
			.rawToMqlc(this.accountMeta.pending || 0)
			.times(this.price.price.lastPrice)
			.toNumber();
		await this.getAccountHistory(this.accountID);

		const qrCode = await QRCode.toDataURL(`${this.accountID}`);
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
		const additionalBlocksInfo = [];

		if (!accountHistory.error) {
			const historyResult = accountHistory.history.result;
			this.accountHistory = historyResult.map(block => {
				if (block.type.toLowerCase() === 'state') {
					// For Open and receive blocks, we need to look up block info to get originating account
					if (block.subtype === 'open' || block.subtype === 'receive') {
						additionalBlocksInfo.push({ hash: block.hash, link: block.link });
						block.addressBookName = this.addressBook.getAccountName(block.account) || null;
					} else {
						block.link_as_account = this.util.account.getPublicAccountID(this.util.hex.toUint8(block.link));
						block.addressBookName = this.addressBook.getAccountName(block.link_as_account) || null;
					}
				} else {
					block.addressBookName = this.addressBook.getAccountName(block.account) || null;
				}
				return block;
			});

			// Remove change blocks now that we are using the raw output
			this.accountHistory = this.accountHistory.filter(h => h.type !== 'change' && h.subtype !== 'change');

			if (additionalBlocksInfo.length) {
				const blocksInfo = await this.api.blocksInfo(additionalBlocksInfo.map(b => b.link));
				for (const block in blocksInfo.blocks) {
					if (!blocksInfo.blocks.hasOwnProperty(block)) {
						continue;
					}
					const matchingBlock = additionalBlocksInfo.find(a => a.link === block);
					if (!matchingBlock) {
						continue;
					}
					const accountInHistory = this.accountHistory.find(h => h.hash === matchingBlock.hash);
					if (!accountInHistory) {
						continue;
					}

					const blockData = blocksInfo.blocks[block];

					accountInHistory.link_as_account = blockData.block_account;
					accountInHistory.addressBookName = this.addressBook.getAccountName(blockData.block_account) || null;
				}
			}
		} else {
			this.accountHistory = [];
		}
	}

	async loadMore() {
		if (this.pageSize <= this.maxPageSize) {
			this.pageSize += 25;
			await this.getAccountHistory(this.accountID, false);
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
		if (!valid || valid.valid !== '1') {
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

		const accountInfo = await this.api.accountInfo(this.accountID);
		this.accountMeta = accountInfo.accountMeta.result;
		const newRep = this.repService.getRepresentative(repAccount);
		this.repLabel = newRep ? newRep.name : '';

		this.notifications.sendSuccess(this.msg4);
	}

	async saveAddressBook() {
		const addressBookName = this.addressBookEntry.trim();
		if (!addressBookName) {
			// Check for deleting an entry in the address book
			if (this.addressBookEntry) {
				this.addressBook.deleteAddress(this.accountID);
				this.notifications.sendSuccess(this.msg5);
				this.addressBookEntry = null;
			}

			this.showEditAddressBook = false;
			return;
		}

		try {
			await this.addressBook.saveAddress(this.accountID, addressBookName);
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
