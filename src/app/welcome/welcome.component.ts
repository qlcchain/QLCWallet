import { Component, OnInit } from '@angular/core';
import {WalletService} from '../services/wallet.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {

  donationAccount = `qlc_3jxu1xnuaazcrxhxjyt6zjmnzb41yg68zjw978krduct66keiyqbq9y5qbs6`;

  wallet = this.walletService.wallet;

  constructor(private walletService: WalletService) { }

  ngOnInit() {
  }

}
