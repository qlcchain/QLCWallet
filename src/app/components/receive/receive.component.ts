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
    private trans: TranslateService
  ) {
    this.loadLang();
  }

  async ngOnInit() {
    await this.loadPendingForAll();
    this.trans.onLangChange.subscribe((event: LangChangeEvent) => {
      this.loadLang();
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
    this.pendingBlocks = [];

    const pending = await this.api.accountsPending(this.accounts.map(a => a.id));
    if (!pending || !pending.blocks) {
      return;
    }

    for (const account in pending.blocks) {
      if (!pending.blocks.hasOwnProperty(account)) {
        continue;
      }
      for (const block in pending.blocks[account]) {
        if (!pending.blocks[account].hasOwnProperty(block)) {
          continue;
        }
        const pendingTx = {
          block: block,
          amount: pending.blocks[account][block].amount,
          source: pending.blocks[account][block].source,
          tokenName: pending.blocks[account][block].token,
          token: pending.blocks[account][block].token_hash,
          account: account,
        };
        // Account should be one of ours, so we should maybe know the frontier block for it?
        this.pendingBlocks.push(pendingTx);
      }
    }

    // Now, only if we have results, do a unique on the account names, and run account info on all of them?
    if (this.pendingBlocks.length) {
      const frontiers = await this.api.accountsFrontiers(this.pendingBlocks.map(p => p.account));
      if (frontiers && frontiers.frontiers) {
        for (const account in frontiers.frontiers) {
          if (frontiers.frontiers.hasOwnProperty(account)) {
            const token_frontiers = frontiers.frontiers[account];
            Object.keys(token_frontiers).map(token_account => {
              const latest_block_hash = token_frontiers[token_account];
              console.log(`[loadPendingForAll]: cache work ${latest_block_hash} of token_account ${token_account} in ${account}`);
              this.workPool.addWorkToCache(latest_block_hash);
            });
          }
        }
      }
    }
  }

  async loadPendingForAccount(account) {
    this.pendingBlocks = [];

    const pending = await this.api.pending(account, 50);
    if (!pending || !pending.blocks) {
      return;
    }

    Object.keys(pending.blocks).map(block => {
      const pendingTx = {
        block: block,
        amount: pending.blocks[block].amount,
        source: pending.blocks[block].source,
        tokenName: pending.blocks[block].token,
        token: pending.blocks[block].token_hash,
        account: account,
      };
      this.pendingBlocks.push(pendingTx);
    });
  }

  async getPending(account) {
    if (!account || account === 0) {
      await this.loadPendingForAll();
    } else {
      await this.loadPendingForAccount(account);
    }
  }

  async receivePending(pendingBlock) {
    const sourceBlock = pendingBlock.block;
    // console.log(pendingBlock);
    const walletAccount = this.walletService.wallet.accounts.find(a => a.id === pendingBlock.account);
    if (!walletAccount) {
      throw new Error(this.msg1);
    }

    if (this.walletService.walletIsLocked()) {
      return this.notificationService.sendWarning(this.msg2);
    }
    pendingBlock.loading = true;

    const newBlock = await this.qlcBlock.generateReceive(walletAccount, sourceBlock, this.walletService.isLedgerWallet());

    if (newBlock) {
      // console.log(sourceBlock);
      // console.log(newBlock);
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
