import { Pipe, PipeTransform } from '@angular/core';
import { AppSettingsService } from '../services/app-settings.service';

@Pipe({
  name: 'qlc'
})
export class QlcPipe implements PipeTransform {
  precision = 6;

  mqlc = 100000000; // 10^8
  kqlc = 100000; // 10^5
  qlc = 100; // 10^2;

  transform(value: any, args?: any): any {
    const opts = args.split(',');
    const denomination = opts[0] || 'mqlc';
    const hideText = opts[1] || false;

    switch (denomination.toLowerCase()) {
      default:
      // case 'xrb': return `${(value / this.mqlc).toFixed(6)}${!hideText ? '' : ''}`;
      case 'mqlc':
        const hasRawValue = (value / this.qlc) % 1;
        if (hasRawValue) {
          // New more precise toFixed function, but bugs on huge raw numbers
          const newVal = value / this.mqlc < 0.000001 ? 0 : value / this.mqlc;
          return `${this.toFixed(newVal, this.precision)}${!hideText ? '' : ''}`;
        } else {
          return `${(value / this.mqlc).toFixed(6)}${!hideText ? '' : ''}`;
        }
      case 'kqlc': return `${(value / this.kqlc).toFixed(3)}${!hideText ? ' kqlc' : ''}`;
      case 'qlc': return `${(value / this.qlc).toFixed(0)}${!hideText ? ' qlc' : ''}`;
      case 'raw': return `${value}${!hideText ? ' raw' : ''}`;
      case 'dynamic':
        const qlc = (value / this.qlc);
        if (qlc >= 1000000) {
          return `${(value / this.mqlc).toFixed(this.precision)}${!hideText ? ' mQlc' : ''}`;
        } else if (qlc >= 1000) {
          return `${(value / this.kqlc).toFixed(this.precision)}${!hideText ? ' kQlc' : ''}`;
        } else if (qlc >= 0.00001) {
          return `${(value / this.qlc).toFixed(this.precision)}${!hideText ? ' Qlc' : ''}`;
        } else if (qlc === 0) {
          return `${value}${!hideText ? ' mQlc' : ''}`;
        } else {
          return `${value}${!hideText ? ' raw' : ''}`;
        }
    }
  }

  toFixed(num, fixed) {
    if (isNaN(num)) {
      return 0;
    }
    const re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
  }

}
