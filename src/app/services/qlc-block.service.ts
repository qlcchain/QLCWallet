import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { UtilService } from './util.service';
import * as blake from 'blakejs';
import { WorkPoolService } from './work-pool.service';
import BigNumber from 'bignumber.js';
import { NotificationService } from './notification.service';
import { AppSettingsService } from './app-settings.service';
import { WalletService } from './wallet.service';
import { LedgerService } from './ledger.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
const nacl = window['nacl'];

const STATE_BLOCK_PREAMBLE = '0000000000000000000000000000000000000000000000000000000000000006';

@Injectable()
export class QLCBlockService {
  representativeAccount = 'qlc_3oftfjxu9x9pcjh1je3xfpikd441w1wo313qjc6ie1es5aobwed5x4pjojic'; // QLC Representative

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
    private ledgerService: LedgerService,
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
    const tokenTypeHash = '125998E086F7011384F89554676B69FCD86769642080CE7EED4A8AA83EF58F36';
    const toAcct = await this.api.accountInfoByToken(walletAccount.id, tokenTypeHash);
    if (!toAcct) {
      throw new Error(this.msg1 + ` ${toAcct.token} ` + this.msg2);
    }

    let blockData;
    const balance = new BigNumber(toAcct.balance);
    const balanceDecimal = balance.toString(10);

    const link = '0000000000000000000000000000000000000000000000000000000000000000';

    let signature = null;
    if (ledger) {
      const ledgerBlock = {
        previousBlock: toAcct.frontier,
        representative: representativeAccount,
        balance: balanceDecimal,
      };
      try {
        this.sendLedgerNotification();
        await this.ledgerService.updateCache(walletAccount.index, toAcct.frontier);
        const sig = await this.ledgerService.signBlock(walletAccount.index, ledgerBlock);
        this.clearLedgerNotification();
        signature = sig.signature;
      } catch (err) {
        this.clearLedgerNotification();
        this.sendLedgerDeniedNotification();
        return;
      }
    }

    if (!this.workPool.workExists(toAcct.frontier)) {
      this.notifications.sendInfo(this.msg3);
    }

    blockData = {
      type: 'state',
      account: walletAccount.id,
      previous: toAcct.frontier,
      representative: representativeAccount,
      balance: balanceDecimal,
      link: link,
      token: tokenTypeHash,
      signature: signature,
      work: await this.workPool.getWork(toAcct.frontier),
    };

    if (!signature) {
      blockData.signature = this.signStateBlock(blockData, walletAccount.keyPair);
    }

    const processResponse = await this.api.process(blockData);
    if (processResponse && processResponse.hash) {
      walletAccount.frontier = processResponse.hash;
      this.workPool.addWorkToCache(processResponse.hash); // Add new hash into the work pool
      this.workPool.removeFromCache(toAcct.frontier);
      return processResponse.hash;
    } else {
      return null;
    }
  }

  async generateSend(walletAccount, toAccountID, tokenTypeHash, rawAmount, ledger = false) {
    const fromAccount = await this.api.accountInfoByToken(walletAccount.id, tokenTypeHash);
    if (!fromAccount) {
      throw new Error(this.msg4 + ` ${walletAccount.id}`);
    }

    const remaining = new BigNumber(fromAccount.balance).minus(rawAmount);
    const remainingDecimal = remaining.toString(10);

    let blockData;
    const representative = fromAccount.representative || this.representativeAccount;

    let signature = null;
    if (ledger) {
      const ledgerBlock = {
        previousBlock: fromAccount.frontier,
        representative: representative,
        balance: remainingDecimal,
        recipient: toAccountID,
      };
      try {
        this.sendLedgerNotification();
        await this.ledgerService.updateCache(walletAccount.index, fromAccount.frontier);
        const sig = await this.ledgerService.signBlock(walletAccount.index, ledgerBlock);
        this.clearLedgerNotification();
        signature = sig.signature;
      } catch (err) {
        this.clearLedgerNotification();
        this.sendLedgerDeniedNotification();
        return;
      }
    }

    if (!this.workPool.workExists(fromAccount.frontier)) {
      this.notifications.sendInfo(this.msg3);
    }

    blockData = {
      type: 'state',
      account: walletAccount.id,
      previous: fromAccount.frontier,
      representative: representative,
      balance: remainingDecimal,
      token: tokenTypeHash,
      link: this.util.account.getAccountPublicKey(toAccountID),
      work: await this.workPool.getWork(fromAccount.frontier),
      signature: signature,
    };

    if (!signature) {
      blockData.signature = this.signStateBlock(blockData, walletAccount.keyPair);
    }

    // console.log(JSON.stringify(blockData));

    const processResponse = await this.api.process(blockData);
    if (!processResponse || !processResponse.hash) {
      throw new Error(processResponse.error || this.msg5);
    }

    walletAccount.frontier = processResponse.hash;
    this.workPool.addWorkToCache(processResponse.hash); // Add new hash into the work pool
    this.workPool.removeFromCache(fromAccount.frontier);

    return processResponse.hash;
  }

  async generateReceive(walletAccount, sourceBlock, ledger = false) {
    const srcBlockInfo = await this.api.blocksInfo([sourceBlock]);
    const srcFullBlockInfo = srcBlockInfo.blocks[sourceBlock];
    srcFullBlockInfo.block = JSON.parse(srcFullBlockInfo.contents);
    const srcAmount = new BigNumber(srcBlockInfo.blocks[sourceBlock].amount);
    const tokenTypeHash = srcFullBlockInfo.block.token;

    const toAcct = await this.api.accountInfoByToken(walletAccount.id, tokenTypeHash);

    let blockData: any = {};
    let workBlock = null;

    const openEquiv = !toAcct || !toAcct.frontier;

    const previousBlock = !openEquiv ? toAcct.frontier : '0000000000000000000000000000000000000000000000000000000000000000';
    const representative = !openEquiv ? toAcct.representative : this.representativeAccount;

    const newBalance = openEquiv ? srcAmount : new BigNumber(toAcct.balance).plus(srcAmount);
    const newBalanceDecimal = newBalance.toString(10);

    // We have everything we need, we need to obtain a signature
    let signature = null;
    if (ledger) {
      const ledgerBlock: any = {
        representative: representative,
        balance: newBalanceDecimal,
        sourceBlock: sourceBlock,
      };
      if (!openEquiv) {
        ledgerBlock.previousBlock = toAcct.frontier;
      }
      try {
        this.sendLedgerNotification();
        // On new accounts, we do not need to cache anything
        if (!openEquiv) {
          await this.ledgerService.updateCache(walletAccount.index, toAcct.frontier);
        }
        const sig = await this.ledgerService.signBlock(walletAccount.index, ledgerBlock);
        this.notifications.removeNotification('ledger-sign');
        signature = sig.signature.toUpperCase();
      } catch (err) {
        this.notifications.removeNotification('ledger-sign');
        this.notifications.sendWarning(this.msg6);
        return;
      }
    }

    workBlock = openEquiv ? this.util.account.getAccountPublicKey(walletAccount.id) : previousBlock;
    blockData = {
      type: 'state',
      account: walletAccount.id,
      previous: previousBlock,
      representative: representative,
      balance: newBalanceDecimal,
      token: tokenTypeHash,
      link: sourceBlock,
      signature: signature,
      work: null
    };

    if (!signature) {
      blockData.signature = this.signStateBlock(blockData, walletAccount.keyPair);
    }

    if (!this.workPool.workExists(workBlock)) {
      this.notifications.sendInfo(this.msg3);
    }

    blockData.work = await this.workPool.getWork(workBlock);
    const processResponse = await this.api.process(blockData);
    if (processResponse && processResponse.hash) {
      walletAccount.frontier = processResponse.hash;
      this.workPool.addWorkToCache(processResponse.hash); // Add new hash into the work pool
      this.workPool.removeFromCache(workBlock);
      return processResponse.hash;
    } else {
      return null;
    }
  }

  signStateBlock(stateBlock, keyPair) {
    const context = blake.blake2bInit(32, null);
    blake.blake2bUpdate(context, this.util.hex.toUint8(STATE_BLOCK_PREAMBLE));
    blake.blake2bUpdate(context, this.util.hex.toUint8(this.util.account.getAccountPublicKey(stateBlock.account)));
    blake.blake2bUpdate(context, this.util.hex.toUint8(stateBlock.previous));
    blake.blake2bUpdate(context, this.util.hex.toUint8(this.util.account.getAccountPublicKey(stateBlock.representative)));
    // encoding balance
    let balancePadded = new BigNumber(stateBlock.balance).toString(16);
    while (balancePadded.length < 32) {
      balancePadded = '0' + balancePadded; // Left pad with 0's
    }
    blake.blake2bUpdate(context, this.util.hex.toUint8(balancePadded));
    blake.blake2bUpdate(context, this.util.hex.toUint8(stateBlock.link));
    blake.blake2bUpdate(context, this.util.hex.toUint8(stateBlock.token));
    const hashBytes = blake.blake2bFinal(context);
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
