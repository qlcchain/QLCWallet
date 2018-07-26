import { Component, OnInit, TemplateRef } from '@angular/core';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { LedgerService, LedgerStatus } from '../../services/ledger.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { TranslateService } from '@ngx-translate/core';

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
  
  modalRef: BsModalRef;
  
  msg1:string = '';
  msg2:string = '';
  msg3:string = '';
  msg4:string = '';
  msg5:string = '';
  msg6:string = '';
  msg7:string = '';
  
  constructor(public walletService: WalletService, private notificationService: NotificationService,
    public ledgerService: LedgerService,private modalService: BsModalService,private trans: TranslateService) { }
    
    ngOnInit() {
      const UIkit = (window as any).UIkit;
      const modal = UIkit.modal(document.getElementById('unlock-wallet-modal'));
      this.modal = modal;
      
      this.ledgerService.ledgerStatus$.subscribe((ledgerStatus: string) => {
        this.ledgerStatus = ledgerStatus;
      });
      this.loadLang();
    }
    
    loadLang() {
      this.trans.get('WALLET_WARNINGS.msg1').subscribe((res: string) => {
        console.log(res);
        this.msg1 = res;
      });
      this.trans.get('WALLET_WARNINGS.msg2').subscribe((res: string) => {
        console.log(res);
        this.msg2 = res;
      });
      this.trans.get('WALLET_WARNINGS.msg3').subscribe((res: string) => {
        console.log(res);
        this.msg3 = res;
      });
      this.trans.get('WALLET_WARNINGS.msg4').subscribe((res: string) => {
        console.log(res);
        this.msg4 = res;
      });
      this.trans.get('WALLET_WARNINGS.msg5').subscribe((res: string) => {
        console.log(res);
        this.msg5 = res;
      });
      this.trans.get('WALLET_WARNINGS.msg6').subscribe((res: string) => {
        console.log(res);
        this.msg6 = res;
      });
      this.trans.get('WALLET_WARNINGS.msg7').subscribe((res: string) => {
        console.log(res);
        this.msg7 = res;
      });
    }
    
    openModal(template: TemplateRef<any>) {
      this.modalRef = this.modalService.show(template);
    }
    
    async unlockWalletConfirm() {
      const unlocked = await this.walletService.unlockWallet(this.unlockPassword);
      this.unlockPassword = '';
      
      if (unlocked) {
        this.notificationService.sendSuccess(this.msg1);
        this.modalRef.hide();
      } else {
        this.notificationService.sendError(this.msg2);
      }
      
      this.unlockPassword = '';
      
    }
    
    async lockWallet() {
      if (this.wallet.type === 'ledger') {
        return; // No need to lock a ledger wallet, no password saved
      }
      if (!this.wallet.password) {
        return this.notificationService.sendWarning(this.msg3);
      }
      const locked = await this.walletService.lockWallet();
      if (locked) {
        this.notificationService.sendSuccess(this.msg4);
      } else {
        this.notificationService.sendError(this.msg5);
      }
    }
    
    async reloadLedger() {
      this.notificationService.sendInfo(this.msg6, { identifier: 'ledger-status', length: 0 });
      try {
        const loaded = await this.ledgerService.loadLedger();
        this.notificationService.removeNotification('ledger-status');
        if (loaded) {
          this.notificationService.sendSuccess(this.msg7);
        }
      } catch (err) {
      }
    }
    
    
    
  }
  