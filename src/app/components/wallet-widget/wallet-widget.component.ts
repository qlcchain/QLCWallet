import { Component, OnInit } from '@angular/core';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { LedgerService, LedgerStatus } from '../../services/ledger.service';

@Component({
  selector: 'app-wallet-widget',
  templateUrl: './wallet-widget.component.html',
  styleUrls: ['./wallet-widget.component.scss']
})
export class WalletWidgetComponent implements OnInit {
  wallet = this.walletService.wallet;

  ledgerStatus = 'not-connected';

  unlockPassword = '';

  modal: any = null;

  constructor(public walletService: WalletService, private notificationService: NotificationService,
    public ledgerService: LedgerService) { }

  ngOnInit() {
    const UIkit = (window as any).UIkit;
    const modal = UIkit.modal(document.getElementById('unlock-wallet-modal'));
    this.modal = modal;

    this.ledgerService.ledgerStatus$.subscribe((ledgerStatus: string) => {
      this.ledgerStatus = ledgerStatus;
    });
  }

  async lockWallet() {
    if (this.wallet.type === 'ledger') {
      return; // No need to lock a ledger wallet, no password saved
    }
    if (!this.wallet.password) {
      return this.notificationService.sendWarning(`You must set a password on your wallet - it is currently blank!`);
    }
    const locked = await this.walletService.lockWallet();
    if (locked) {
      this.notificationService.sendSuccess(`Wallet locked`);
    } else {
      this.notificationService.sendError(`Unable to lock wallet`);
    }
  }

  async reloadLedger() {
    this.notificationService.sendInfo(`Checking Ledger Status...`, { identifier: 'ledger-status', length: 0 });
    try {
      const loaded = await this.ledgerService.loadLedger();
      this.notificationService.removeNotification('ledger-status');
      if (loaded) {
        this.notificationService.sendSuccess(`Successfully connected to Ledger device`);
      }
    } catch (err) {
    }
  }

  async unlockWallet() {
    const unlocked = await this.walletService.unlockWallet(this.unlockPassword);
    this.unlockPassword = '';

    if (unlocked) {
      this.notificationService.sendSuccess(`Wallet unlocked`);
      this.modal.hide();
    } else {
      this.notificationService.sendError(`Invalid password, please try again!`);
    }

    this.unlockPassword = '';
  }

}
