import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { UtilService } from './util.service';
import * as blake from 'blakejs';
import BigNumber from 'bignumber.js';
import { WorkPoolService } from './work-pool.service';
import { NotificationService } from './notification.service';
import { AppSettingsService } from './app-settings.service';
import { WalletService } from './wallet.service';
// import { LedgerService } from './ledger.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
const nacl = window['nacl'];

const STATE_BLOCK_PREAMBLE = '0000000000000000000000000000000000000000000000000000000000000000';

@Injectable()
export class QLCBlockService {
	representativeAccount = 'qlc_3oftfjxu9x9pcjh1je3xfpikd441w1wo313qjc6ie1es5aobwed5x4pjojic'; // QLC Representative
	zeroHash = '0000000000000000000000000000000000000000000000000000000000000000';

	msg1 = '';
	msg2 = '';
	msg3 = '';
	msg4 = '';
	msg5 = '';
	msg6 = '';
	msg7 = '';

	constructor(
		private api: ApiService,
		private util: UtilService,
		private workPool: WorkPoolService,
		private notifications: NotificationService,
		// private ledgerService: LedgerService,
		public settings: AppSettingsService,
		private trans: TranslateService
	) {
		this.loadLang();
		this.trans.onLangChange.subscribe((event: LangChangeEvent) => {
			this.loadLang();
		});
	}

	loadLang() {
		this.trans.get('SERVICE_WARNINGS_QLC_SERVICE.msg1').subscribe((res: string) => {
			// console.log(res);
			this.msg1 = res;
		});
		this.trans.get('SERVICE_WARNINGS_QLC_SERVICE.msg2').subscribe((res: string) => {
			// console.log(res);
			this.msg2 = res;
		});
		this.trans.get('SERVICE_WARNINGS_QLC_SERVICE.msg3').subscribe((res: string) => {
			// console.log(res);
			this.msg3 = res;
		});
		this.trans.get('SERVICE_WARNINGS_QLC_SERVICE.msg4').subscribe((res: string) => {
			// console.log(res);
			this.msg4 = res;
		});
		this.trans.get('SERVICE_WARNINGS_QLC_SERVICE.msg5').subscribe((res: string) => {
			// console.log(res);
			this.msg5 = res;
		});
		this.trans.get('SERVICE_WARNINGS_QLC_SERVICE.msg6').subscribe((res: string) => {
			// console.log(res);
			this.msg6 = res;
		});
		this.trans.get('SERVICE_WARNINGS_QLC_SERVICE.msg7').subscribe((res: string) => {
			// console.log(res);
			this.msg7 = res;
		});
	}

	async generateChange(walletAccount, representativeAccount, ledger = false) {
		const toAcct = await this.api.accountInfoByToken(walletAccount.id, this.api.qlcTokenHash);
		if (!toAcct) {
			throw new Error(this.msg1 + ` ${toAcct.token} ` + this.msg2);
		}

		let blockData;
		const balanceDecimal = new BigNumber(toAcct.balance).toString(10);

		const signature = null;

		if (!this.workPool.workExists(toAcct.header)) {
			this.notifications.sendInfo(this.msg3);
		}

		blockData = {
			type: 'State',
			address: walletAccount.id,
			previous: toAcct.header,
			representative: representativeAccount,
			balance: balanceDecimal,
			link: this.zeroHash,
			extra: this.zeroHash,
			token: this.api.qlcTokenHash,
			signature: signature,
			work: await this.workPool.getWork(toAcct.header)
		};

		if (!signature) {
			blockData.signature = this.signStateBlock(blockData, walletAccount.keyPair);
		}

		const processResponse = await this.api.process(blockData);
		if (processResponse && processResponse.result) {
			walletAccount.header = processResponse.result;
			this.workPool.addWorkToCache(processResponse.result); // Add new hash into the work pool
			this.workPool.removeFromCache(toAcct.header);
			return processResponse.result;
		} else {
			return null;
		}
	}

	async generateSend(walletAccount, toAccountID, tokenTypeHash, rawAmount, ledger = false) {
		const fromAccount = await this.api.accountInfoByToken(walletAccount.id, tokenTypeHash);
		// console.log(JSON.stringify(fromAccount, null, 4));
		if (!fromAccount) {
			throw new Error(this.msg4 + ` ${walletAccount.id}`);
		}

		const remainingDecimal = new BigNumber(fromAccount.balance).minus(rawAmount).toString(10);

		const representative = fromAccount.rep || this.representativeAccount;

		const signature = null;

		if (!this.workPool.workExists(fromAccount.header)) {
			this.notifications.sendInfo(this.msg3);
		}
		const work = await this.workPool.getWork(fromAccount.header);
		// console.log('work >>> ' + work);
		const blockData = {
			type: 'State',
			address: walletAccount.id,
			previous: fromAccount.header,
			representative: representative,
			balance: remainingDecimal,
			token: tokenTypeHash,
			link: this.util.account.getAccountPublicKey(toAccountID),
			extra: this.zeroHash,
			work: work,
			signature: signature
		};

		if (!signature) {
			blockData.signature = this.signStateBlock(blockData, walletAccount.keyPair);
		}
		// console.log(JSON.stringify(blockData, null, 4));

		const processResponse = await this.api.process(blockData);
		// console.log(processResponse);

		if (!processResponse || processResponse.error) {
			throw new Error(processResponse.error || this.msg5);
		}

		walletAccount.header = processResponse.result;
		this.workPool.addWorkToCache(processResponse.result); // Add new hash into the work pool
		this.workPool.removeFromCache(fromAccount.header);

		return processResponse.result;
	}

	async generateReceive(walletAccount, sourceBlock, ledger = false) {
		const srcBlockInfo = await this.api.blocksInfo([sourceBlock]);
		if (srcBlockInfo && !srcBlockInfo.error && srcBlockInfo.result.length > 0) {
			// console.log('find block info of ' + sourceBlock);
		} else {
			// console.log('can not find block info of ' + sourceBlock);
			return null;
		}
		const sendBlock = srcBlockInfo.result[0];

		const srcAmount = new BigNumber(sendBlock.amount);
		const tokenTypeHash = sendBlock.token;

		const toAcct = await this.api.accountInfoByToken(walletAccount.id, tokenTypeHash);
		const openEquiv = !toAcct || !toAcct.header;
		const previousBlock = !openEquiv ? toAcct.header : this.zeroHash;
		const representative = !openEquiv ? toAcct.rep : this.representativeAccount;
		const newBalanceDecimal = openEquiv ? srcAmount : new BigNumber(toAcct.balance).plus(srcAmount).toString(10);

		// We have everything we need, we need to obtain a signature
		const signature = null;

		const workBlock = openEquiv ? this.util.account.getAccountPublicKey(walletAccount.id) : previousBlock;
		if (!this.workPool.workExists(workBlock)) {
			this.notifications.sendInfo(this.msg3);
		}

		const work = await this.workPool.getWork(workBlock);
		console.log('receive block: ' + work);
		const blockData = {
			type: 'State',
			address: walletAccount.id,
			previous: previousBlock,
			representative: representative,
			balance: newBalanceDecimal,
			token: tokenTypeHash,
			link: sourceBlock,
			extra: this.zeroHash,
			work: work,
			signature: signature
		};

		if (!signature) {
			blockData.signature = this.signStateBlock(blockData, walletAccount.keyPair);
		}

		const processResponse = await this.api.process(blockData);
		if (processResponse && processResponse.result) {
			const header = processResponse.result;
			walletAccount.header = header;
			this.workPool.addWorkToCache(processResponse.result); // Add new hash into the work pool
			this.workPool.removeFromCache(workBlock);
			return header;
		} else {
			return null;
		}
	}

	signStateBlock(stateBlock, keyPair) {
		const context = blake.blake2bInit(32, null);
		// console.log('type: ' + this.util.hex.fromUint8(this.util.hex.toUint8(STATE_BLOCK_PREAMBLE)));
		blake.blake2bUpdate(context, this.util.hex.toUint8(STATE_BLOCK_PREAMBLE));
		// console.log(
		// 	'address: ' +
		// 		this.util.hex.fromUint8(this.util.hex.toUint8(this.util.account.getAccountPublicKey(stateBlock.address)))
		// );
		blake.blake2bUpdate(context, this.util.hex.toUint8(this.util.account.getAccountPublicKey(stateBlock.address)));
		// console.log('previous: ' + this.util.hex.fromUint8(this.util.hex.toUint8(stateBlock.previous)));
		blake.blake2bUpdate(context, this.util.hex.toUint8(stateBlock.previous));
		// console.log('token: ' + this.util.hex.fromUint8(this.util.hex.toUint8(stateBlock.token)));
		blake.blake2bUpdate(context, this.util.hex.toUint8(stateBlock.token));
		// console.log(
		// 	'rep: ' +
		// 		this.util.hex.fromUint8(this.util.hex.toUint8(this.util.account.getAccountPublicKey(stateBlock.representative)))
		// );
		blake.blake2bUpdate(
			context,
			this.util.hex.toUint8(this.util.account.getAccountPublicKey(stateBlock.representative))
		);

		const balance = new BigNumber(stateBlock.balance).toString(16);
		// console.log(
		// 	`balance:  ${stateBlock.balance}(${balance}) >>> ${this.util.hex.fromUint8(this.util.hex.toUint8(balance))}(${this.util.hex.toUint8(balance)})}`
		// );
		blake.blake2bUpdate(context, this.util.hex.toUint8(balance));
		// console.log('link: ' + this.util.hex.fromUint8(this.util.hex.toUint8(stateBlock.link)));
		blake.blake2bUpdate(context, this.util.hex.toUint8(stateBlock.link));
		// console.log('extra: ' + this.util.hex.fromUint8(this.util.hex.toUint8(stateBlock.extra)));
		blake.blake2bUpdate(context, this.util.hex.toUint8(stateBlock.extra));
		const hashBytes = blake.blake2bFinal(context);
		// console.log('block hash >>> ' + this.util.hex.fromUint8(hashBytes));

		const privKey = keyPair.secretKey;
		const signed = nacl.sign.detached(hashBytes, privKey);
		const signature = this.util.hex.fromUint8(signed);
		return signature;
	}

	sendLedgerDeniedNotification() {
		this.notifications.sendWarning(this.msg6);
	}
	sendLedgerNotification() {
		this.notifications.sendInfo(this.msg7, { identifier: 'ledger-sign', length: 0 });
	}
	clearLedgerNotification() {
		this.notifications.removeNotification('ledger-sign');
	}
}
