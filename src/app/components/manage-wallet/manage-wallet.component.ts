import { Component, OnInit } from '@angular/core';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import * as QRCode from 'qrcode';
import { AddressBookService } from '../../services/address-book.service';
import { Router } from '@angular/router';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import * as bip from 'bip39';

@Component({
  selector: 'app-manage-wallet',
  templateUrl: './manage-wallet.component.html',
  styleUrls: ['./manage-wallet.component.scss']
})
export class ManageWalletComponent implements OnInit {
  wallet = this.walletService.wallet;
  accounts = this.walletService.wallet.accounts;

  msg1 = '';
  msg2 = '';
  msg3 = '';
  msg4 = '';
  msg5 = '';
  msg6 = '';
  msg7 = '';
  msg8 = '';
  msg9 = '';
  msg10 = '';
  msg11 = '';

  newPassword = '';
  confirmPassword = '';

  showQRExport = false;
  QRExportUrl = '';
  QRExportImg = '';
  addressBookShowQRExport = false;
  addressBookQRExportUrl = '';
  addressBookQRExportImg = '';

  constructor(
    public walletService: WalletService,
    private addressBookService: AddressBookService,
    public notifications: NotificationService,
    private router: Router,
    private trans: TranslateService
  ) {
    this.loadLang();
  }

  async ngOnInit() {
    this.wallet = this.walletService.wallet;
    this.trans.onLangChange.subscribe((event: LangChangeEvent) => {
      this.loadLang();
    });
  }

  loadLang() {
    this.trans.get('MANAGE_WALLET_WARNINGS.msg1').subscribe((res: string) => {
      console.log(res);
      this.msg1 = res;
    });
    this.trans.get('MANAGE_WALLET_WARNINGS.msg2').subscribe((res: string) => {
      console.log(res);
      this.msg2 = res;
    });
    this.trans.get('MANAGE_WALLET_WARNINGS.msg3').subscribe((res: string) => {
      console.log(res);
      this.msg3 = res;
    });
    this.trans.get('MANAGE_WALLET_WARNINGS.msg4').subscribe((res: string) => {
      console.log(res);
      this.msg4 = res;
    });
    this.trans.get('MANAGE_WALLET_WARNINGS.msg5').subscribe((res: string) => {
      console.log(res);
      this.msg5 = res;
    });
    this.trans.get('MANAGE_WALLET_WARNINGS.msg6').subscribe((res: string) => {
      console.log(res);
      this.msg6 = res;
    });
    this.trans.get('MANAGE_WALLET_WARNINGS.msg7').subscribe((res: string) => {
      console.log(res);
      this.msg7 = res;
    });
    this.trans.get('MANAGE_WALLET_WARNINGS.msg8').subscribe((res: string) => {
      console.log(res);
      this.msg8 = res;
    });
    this.trans.get('MANAGE_WALLET_WARNINGS.msg9').subscribe((res: string) => {
      console.log(res);
      this.msg9 = res;
    });
    this.trans.get('MANAGE_WALLET_WARNINGS.msg10').subscribe((res: string) => {
      console.log(res);
      this.msg10 = res;
    });
    this.trans.get('MANAGE_WALLET_WARNINGS.msg11').subscribe((res: string) => {
      console.log(res);
      this.msg11 = res;
    });
  }

  async changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      return this.notifications.sendError(this.msg1);
    }
    if (this.newPassword.length < 1) {
      return this.notifications.sendError(this.msg2);
    }
    if (this.walletService.walletIsLocked()) {
      return this.notifications.sendWarning(this.msg3);
    }

    this.walletService.wallet.password = this.newPassword;
    this.walletService.saveWalletExport();

    this.newPassword = '';
    this.confirmPassword = '';
    this.notifications.sendSuccess(this.msg4);
  }

  async exportWallet() {
    if (this.walletService.walletIsLocked()) {
      return this.notifications.sendWarning(this.msg5);
    }

    const exportUrl = this.walletService.generateExportUrl();
    this.QRExportUrl = exportUrl;
    this.QRExportImg = await QRCode.toDataURL(exportUrl);
    this.showQRExport = true;
  }

  copied() {
    this.notifications.sendSuccess(this.msg6);
  }

  seedMnemonic() {
    return bip.entropyToMnemonic(this.wallet.seed);
  }

  async exportAddressBook() {
    const exportData = this.addressBookService.addressBook;
    if (exportData.length >= 25) {
      return this.notifications.sendError(this.msg7);
    }
    const base64Data = btoa(JSON.stringify(exportData));
    const exportUrl = `https://wallet.qclchain.online/import-address-book#${base64Data}`;

    this.addressBookQRExportUrl = exportUrl;
    this.addressBookQRExportImg = await QRCode.toDataURL(exportUrl);
    this.addressBookShowQRExport = true;
  }

  exportAddressBookToFile() {
    if (this.walletService.walletIsLocked()) {
      return this.notifications.sendWarning(this.msg3);
    }
    const fileName = `QLC-AddressBook.json`;

    const exportData = this.addressBookService.addressBook;
    this.triggerFileDownload(fileName, exportData);

    this.notifications.sendSuccess(this.msg8);
  }

  triggerFileDownload(fileName, exportData) {
    const blob = new Blob([JSON.stringify(exportData)], {
      type: 'application/json'
    });

    // Check for iOS, which is weird with saving files
    const iOS =
      !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, fileName);
    } else {
      const elem = window.document.createElement('a');
      const objUrl = window.URL.createObjectURL(blob);
      if (iOS) {
        elem.href = `data:attachment/file,${JSON.stringify(exportData)}`;
      } else {
        elem.href = objUrl;
      }
      elem.download = fileName;
      document.body.appendChild(elem);
      elem.click();
      setTimeout(function() {
        document.body.removeChild(elem);
        window.URL.revokeObjectURL(objUrl);
      }, 200);
    }
  }

  exportToFile() {
    if (this.walletService.walletIsLocked()) {
      return this.notifications.sendWarning(this.msg3);
    }

    const fileName = `QLC-Wallet.json`;
    const exportData = this.walletService.generateExportData();
    this.triggerFileDownload(fileName, exportData);

    this.notifications.sendSuccess(this.msg9);
  }

  importFromFile(files) {
    if (!files.length) {
      return;
    }

    const file = files[0];
    const reader = new FileReader();
    reader.onload = event => {
      const fileData = event.target['result'];
      try {
        const importData = JSON.parse(fileData);
        if (!importData.length || !importData[0].account) {
          return this.notifications.sendError(this.msg10);
        }

        const walletEncrypted = btoa(JSON.stringify(importData));
        this.router.navigate(['import-address-book'], {
          fragment: walletEncrypted
        });
      } catch (err) {
        this.notifications.sendError(this.msg11);
      }
    };

    reader.readAsText(file);
  }
}
