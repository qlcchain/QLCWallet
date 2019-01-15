import { AfterViewInit, Component, OnInit } from '@angular/core';
import { AddressBookService } from '../../services/address-book.service';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { ModalService } from '../../services/modal.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';

@Component({
	selector: 'app-address-book',
	templateUrl: './address-book.component.html',
	styleUrls: ['./address-book.component.scss']
})
export class AddressBookComponent implements OnInit, AfterViewInit {
	activePanel = 0;

	msg1 = '';
	msg2 = '';
	msg3 = '';
	msg4 = '';
	msg5 = '';
	msg6 = '';
	msg7 = '';
	msg8 = '';
	msg9 = '';

	addressBook$ = this.addressBookService.addressBook$;
	newAddressAccount = '';
	newAddressName = '';

	constructor(
		private addressBookService: AddressBookService,
		private walletService: WalletService,
		private notificationService: NotificationService,
		public modal: ModalService,
		private router: Router,
		private nodeApi: ApiService,
		private trans: TranslateService
	) {
		this.loadLang();
	}

	async ngOnInit() {
		this.addressBookService.loadAddressBook();
		this.trans.onLangChange.subscribe((event: LangChangeEvent) => {
			this.loadLang();
		});
	}

	loadLang() {
		this.trans.get('ADDRESS_BOOK_WARNINGS.msg1').subscribe((res: string) => {
			// console.log(res);
			this.msg1 = res;
		});
		this.trans.get('ADDRESS_BOOK_WARNINGS.msg2').subscribe((res: string) => {
			// console.log(res);
			this.msg2 = res;
		});
		this.trans.get('ADDRESS_BOOK_WARNINGS.msg3').subscribe((res: string) => {
			// console.log(res);
			this.msg3 = res;
		});
		this.trans.get('ADDRESS_BOOK_WARNINGS.msg4').subscribe((res: string) => {
			// console.log(res);
			this.msg4 = res;
		});
		this.trans.get('ADDRESS_BOOK_WARNINGS.msg5').subscribe((res: string) => {
			// console.log(res);
			this.msg5 = res;
		});
		this.trans.get('ADDRESS_BOOK_WARNINGS.msg6').subscribe((res: string) => {
			// console.log(res);
			this.msg6 = res;
		});
		this.trans.get('ADDRESS_BOOK_WARNINGS.msg7').subscribe((res: string) => {
			// console.log(res);
			this.msg7 = res;
		});
		this.trans.get('ADDRESS_BOOK_WARNINGS.msg8').subscribe((res: string) => {
			// console.log(res);
			this.msg8 = res;
		});
		this.trans.get('ADDRESS_BOOK_WARNINGS.msg9').subscribe((res: string) => {
			// console.log(res);
			this.msg9 = res;
		});
	}

	ngAfterViewInit() {
		// Listen for reordering events
		if (document.getElementById('address-book-sortable')) {
			document.getElementById('address-book-sortable').addEventListener('moved', e => {
				const elements = e.srcElement.children;

				const result = [].slice.call(elements);
				const datas = result.map(entry => entry.dataset.account);

				this.addressBookService.setAddressBookOrder(datas);
				this.notificationService.sendSuccess(this.msg1);
			});
		}
	}

	editEntry(addressBook) {
		this.newAddressAccount = addressBook.account;
		this.newAddressName = addressBook.name;
		this.activePanel = 1;
		setTimeout(() => {
			document.getElementById('new-address-name').focus();
		}, 150);
	}

	async saveNewAddress() {
		if (!this.newAddressAccount || !this.newAddressName) {
			return this.notificationService.sendError(this.msg2);
		}

		this.newAddressAccount = this.newAddressAccount.replace(/ /g, ''); // Remove spaces

		// Make sure name doesn't exist
		if (this.addressBookService.nameExists(this.newAddressName)) {
			return this.notificationService.sendError(this.msg3);
		}

		// Make sure the address is valid
		const valid = await this.nodeApi.validateAccountNumber(this.newAddressAccount);
		if (!valid.result) {
			return this.notificationService.sendWarning(this.msg4);
		}

		try {
			await this.addressBookService.saveAddress(this.newAddressAccount, this.newAddressName);
			this.notificationService.sendSuccess(this.msg5);
			// IF this is one of our accounts, set its name, and hope things update?
			const walletAccount = this.walletService.wallet.accounts.find(
				a => a.id.toLowerCase() === this.newAddressAccount.toLowerCase()
			);
			if (walletAccount) {
				walletAccount.addressBookName = this.newAddressName;
			}
			this.cancelNewAddress();
		} catch (err) {
			this.notificationService.sendError(this.msg6 + ` ${err.message}`);
		}
	}

	cancelNewAddress() {
		this.newAddressName = '';
		this.newAddressAccount = '';
		this.activePanel = 0;
	}

	copied() {
		this.notificationService.sendSuccess(this.msg7);
	}

	async deleteAddress(account) {
		try {
			this.addressBookService.deleteAddress(account);
			this.notificationService.sendSuccess(this.msg8);
		} catch (err) {
			this.notificationService.sendError(this.msg9 + ` ${err.message}`);
		}
	}
}
