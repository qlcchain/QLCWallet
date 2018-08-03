import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-qlc-account-id',
  templateUrl: './qlc-account-id.component.html',
  styleUrls: ['./qlc-account-id.component.css']
})
export class QlcAccountIdComponent implements OnInit {
  // tslint:disable-next-line:no-input-rename
  @Input('accountID') accountID: string;

  firstCharacters = '';
  lastCharacters = '';

  constructor() {}

  ngOnInit() {
    const account = this.accountID;
    const openingChars = 9;
    const closingChars = 5;
    this.firstCharacters = account
      .split('')
      .slice(0, openingChars)
      .join('');
    this.lastCharacters = account
      .split('')
      .slice(-closingChars)
      .join('');
    // return `<span style="color: #f00;">${firstChars}</span>.....${lastChars}`;
  }
}
