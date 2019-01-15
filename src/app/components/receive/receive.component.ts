import { Component, OnInit } from '@angular/core';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { ModalService } from '../../services/modal.service';
import { ApiService } from '../../services/api.service';
import * as blake from 'blakejs';
import BigNumber from 'bignumber.js';
import { UtilService } from '../../services/util.service';
import { WorkPoolService } from '../../services/work-pool.service';
import { AppSettingsService } from '../../services/app-settings.service';
import { QLCBlockService } from '../../services/qlc-block.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { NGXLogger } from 'ngx-logger';
import { interval } from 'rxjs';
const nacl = window['nacl'];

@Component({
	selector: 'app-receive',
	templateUrl: './receive.component.html',
	styleUrls: ['./receive.component.scss']
})
export class ReceiveComponent implements OnInit {
	accounts = this.walletService.wallet.accounts;

	pendingAccountModel = 0;
	pendingBlocks = [];

	private refreshInterval$ = interval(1000);

	msg1 = '';
	msg2 = '';
	msg3 = '';
	msg4 = '';
	msg5 = '';

	constructor(
		private walletService: WalletService,
		private notificationService: NotificationService,
		public modal: ModalService,
		private api: ApiService,
		private workPool: WorkPoolService,
		public settings: AppSettingsService,
		private qlcBlock: QLCBlockService,
		private util: UtilService,
		private trans: TranslateService,
		private logger: NGXLogger
	) {
		this.loadLang();
	}

	async ngOnInit() {
		await this.loadPendingForAll();
		this.trans.onLangChange.subscribe((event: LangChangeEvent) => {
			this.loadLang();
		});

		this.refreshInterval$.subscribe(() => {
			if (this.pendingBlocks.length !== this.walletService.wallet.pendingCount) {
				this.loadPendingForAll();
			}
		});
	}

	loadLang() {
		this.trans.get('RECEIVE_WARNINGS.msg1').subscribe((res: string) => {
			// console.log(res);
			this.msg1 = res;
		});
		this.trans.get('RECEIVE_WARNINGS.msg2').subscribe((res: string) => {
			// console.log(res);
			this.msg2 = res;
		});
		this.trans.get('RECEIVE_WARNINGS.msg3').subscribe((res: string) => {
			// console.log(res);
			this.msg3 = res;
		});
		this.trans.get('RECEIVE_WARNINGS.msg4').subscribe((res: string) => {
			// console.log(res);
			this.msg4 = res;
		});
		this.trans.get('RECEIVE_WARNINGS.msg5').subscribe((res: string) => {
			// console.log(res);
			this.msg5 = res;
		});
	}

	async loadPendingForAll() {
		return this.loadPendingByAccounts(this.accounts.map(a => a.id));
	}

	async loadPendingByAccounts(accounts) {
		this.pendingBlocks = [];

		const accoutsPending = await this.api.accountsPending(accounts);
		if (accoutsPending.error) {
			return;
		}

		const pendingResult = accoutsPending.result;

		for (const account in pendingResult) {
			if (!pendingResult.hasOwnProperty(account)) {
				continue;
			}

			pendingResult[account].forEach(pending => {
				const pendingTx = {
					block: pending.hash,
					amount: pending.pendingInfo.amount,
					source: pending.pendingInfo.source,
					tokenName: pending.tokenName,
					token: pending.type,
					account: account
				};
				// Account should be one of ours, so we should maybe know the frontier block for it?
				this.pendingBlocks.push(pendingTx);
			});
		}

		// Now, only if we have results, do a unique on the account names, and run account info on all of them?
		if (this.pendingBlocks.length) {
			const accountsFrontier = await this.api.accountsFrontiers(this.pendingBlocks.map(p => p.account));
			if (!accountsFrontier.error) {
				const frontierResult = accountsFrontier.result;
				for (const account in frontierResult) {
					if (!frontierResult.hasOwnProperty(account)) {
						continue;
					}
					const tokensFrontierMap = frontierResult[account];
					Object.keys(tokensFrontierMap).map(tokenType => {
						const latestBlockHash = tokensFrontierMap[tokenType];
						this.logger.debug(
							`[loadPendingForAll]: cache work ${latestBlockHash} of token_account ${tokenType} in ${account}`
						);
						this.workPool.addWorkToCache(latestBlockHash);
					});
				}
			}
		}
	}

	async loadPendingForAccount(account) {
		return this.loadPendingByAccounts([account]);
	}

	async getPending(account) {
		if (!account || account === 0) {
			await this.loadPendingForAll();
		} else {
			await this.loadPendingForAccount(account);
		}
	}

	async receivePending(pendingBlock) {
		const sendBlock = pendingBlock.block;
		if (!sendBlock) return;
		const walletAccount = this.walletService.wallet.accounts.find(a => a.id === pendingBlock.account);
		if (!walletAccount) {
			throw new Error(this.msg1);
		}

		if (this.walletService.walletIsLocked()) {
			return this.notificationService.sendWarning(this.msg2);
		}
		pendingBlock.loading = true;

		const newBlock = await this.qlcBlock.generateReceive(walletAccount, sendBlock, this.walletService.isLedgerWallet());
		// console.log('receive block hash >>> ' + newBlock);
		if (newBlock) {
			this.notificationService.sendSuccess(this.msg3 + ` ` + pendingBlock.tokenName);
		} else {
			if (!this.walletService.isLedgerWallet()) {
				this.notificationService.sendError(this.msg4);
			}
		}

		pendingBlock.loading = false;

		await this.walletService.reloadBalances();
		await this.loadPendingForAll();
	}

	copied() {
		this.notificationService.sendSuccess(this.msg5);
	}
}
