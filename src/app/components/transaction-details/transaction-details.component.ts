import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, ChildActivationEnd, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AppSettingsService } from '../../services/app-settings.service';
import BigNumber from 'bignumber.js';
import { AddressBookService } from '../../services/address-book.service';
import { UtilService } from 'app/services/util.service';

@Component({
	selector: 'app-transaction-details',
	templateUrl: './transaction-details.component.html',
	styleUrls: ['./transaction-details.component.scss']
})
export class TransactionDetailsComponent implements OnInit {
	qlc = 100000000;

	routerSub = null;
	transaction: any = {};
	hashID = '';
	blockType = 'send';

	toAccountID = '';
	fromAccountID = '';
	toAddressBook = '';
	fromAddressBook = '';
	token = '';

	transactionJSON = '';
	showBlockData = false;

	amountRaw = new BigNumber(0);

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private addressBook: AddressBookService,
		private api: ApiService,
		private util: UtilService,
		public settings: AppSettingsService
	) {}

	async ngOnInit() {
		this.routerSub = this.router.events.subscribe(event => {
			if (event instanceof ChildActivationEnd) {
				this.loadTransaction(); // Reload the state when navigating to itself from the transactions page
			}
		});

		await this.loadTransaction();
	}

	async loadTransaction() {
		this.toAccountID = '';
		this.fromAccountID = '';
		this.toAddressBook = '';
		this.fromAddressBook = '';
		this.transactionJSON = '';
		this.showBlockData = false;
		this.token = '';
		// let legacyFromAccount = '';
		this.amountRaw = new BigNumber(0);
		const hash = this.route.snapshot.params.transaction;
		this.hashID = hash;
		const blockData = await this.api.blocksInfo([hash]);
		if (!blockData || blockData.error) {
			this.transaction = null;
			return;
		}
		const hashData = blockData.result[0];
		// const hashContents = JSON.parse(hashData);
		// hashData.contents = hashContents;

		this.transactionJSON = JSON.stringify(hashData, null, 4);

		const tokenInfo = await this.api.tokenByHash(hashData.token);
		if (!tokenInfo) {
			console.warn('failed to query ');
		} else {
			this.token = tokenInfo.tokenSymbol;
		}
		this.token = this.token || hashData.tokenName;
		this.blockType = hashData.subType;

		if (hashData.balance) {
			this.amountRaw = new BigNumber(hashData.amount).mod(this.qlc);
		}

		this.transaction = hashData;

		let fromAccount = '';
		let toAccount = '';
		switch (this.blockType) {
			case 'send':
				fromAccount = this.transaction.address;
				toAccount = this.util.account.getPublicAccountID(this.util.hex.toUint8(this.transaction.link));
				break;
			case 'open':
				const linkBlock = await this.api.blocksInfo([this.transaction.link]);
				if (!linkBlock.error) {
					fromAccount = linkBlock.result[0].address;
				} else {
					fromAccount = this.util.account.getPublicAccountID(this.util.hex.toUint8(this.transaction.link));
				}
				toAccount = this.transaction.address;
				break;
			case 'receive':
				fromAccount = this.util.account.getPublicAccountID(this.util.hex.toUint8(this.transaction.link));
				toAccount = this.transaction.address;
				break;
			case 'change':
				fromAccount = this.transaction.address;
				toAccount = this.transaction.representative;
				break;
		}

		// if (legacyFromAccount) {
		// 	fromAccount = legacyFromAccount;
		// }

		this.toAccountID = toAccount;
		this.fromAccountID = fromAccount;

		this.fromAddressBook = this.addressBook.getAccountName(fromAccount);
		this.toAddressBook = this.addressBook.getAccountName(toAccount);
	}

	getBalanceFromHex(balance) {
		return new BigNumber(balance, 16);
	}

	getBalanceFromDec(balance) {
		return new BigNumber(balance, 10);
	}
}
