import { Pipe, PipeTransform } from '@angular/core';
import { AppSettingsService } from '../services/app-settings.service';

@Pipe({
	name: 'qlc'
})
export class QlcPipe implements PipeTransform {
	precision = 6;

	mqlc = 100000000000; // 10^11
	QLC = 100000000; // 10^8
	kqlc = 1000; // 10^3
	qlc = 1; // 10^0;

	transform(value: any, args?: any): any {
		const opts = args.split(',');
		const denomination = opts[0] || '';
		const hideText = opts[1] || false;

		switch (denomination) {
			default:
			// case 'xrb': return `${(value / this.mqlc).toFixed(6)}${!hideText ? '' : ''}`;
			// case 'MQLC':
			// 	const hasRawValue = (value / this.qlc) % 1;
			// 	if (hasRawValue) {
			// 		// New more precise toFixed function, but bugs on huge raw numbers
			// 		const newVal = value / this.mqlc < 0.000001 ? 0 : value / this.mqlc;
			// 		return `${this.toFixed(newVal, this.precision)}${!hideText ? ' MQLC' : ''}`;
			// 	} else {
			// 		return `${(value / this.mqlc).toFixed(6)}${!hideText ? ' MQLC2' : ''}`;
			// 	}
			case 'QLC':
				return `${(value / this.QLC).toFixed(3)}${!hideText ? ' QLC' : ''}`;
			case 'kqlc':
				return `${(value / this.kqlc).toFixed(3)}${!hideText ? ' kqlc' : ''}`;
			case 'qlc':
				return `${(value / this.qlc).toFixed(0)}${!hideText ? ' qlc' : ''}`;
			case 'raw':
				return `${value}${!hideText ? ' qlc' : ''}`;
			case 'dynamic':
				const qlc = value / this.qlc;
				if (qlc >= this.mqlc) {
					return `${(value / this.mqlc).toFixed(this.precision)}${!hideText ? ' MQLC' : ''}`;
				} else if (qlc >= this.QLC) {
					return `${(value / this.QLC).toFixed(this.precision)}${!hideText ? ' QLC' : ''}`;
				} else if (qlc >= this.kqlc) {
					return `${(value / this.kqlc).toFixed(this.precision)}${!hideText ? ' kqlc' : ''}`;
				} else if (qlc >= 0.00001) {
					return `${(value / this.qlc).toFixed(this.precision)}${!hideText ? ' qlc' : ''}`;
				} else {
					return `${value}${!hideText ? ' qlc' : ''}`;
				}
		}
	}

	toFixed(num, fixed) {
		if (isNaN(num)) {
			return 0;
		}
		const re = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?');
		return num.toString().match(re)[0];
	}
}
