import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class RepresentativeService {
	storeKey = `qlcwallet-representatives`;

	representatives$ = new BehaviorSubject([]);
	representatives = [];

	loaded = false;

	// Default representatives list
	defaultRepresentatives = [
		{
			id: 'qlc_3oftfjxu9x9pcjh1je3xfpikd441w1wo313qjc6ie1es5aobwed5x4pjojic',
			name: 'QLCChain genesis Rep',
			trusted: true
		},
		{
			id: 'qlc_371pkh5kkd1dn43cwxnbb1a4yg363rh9un9a13kkezbcppuicejxgixyyrrw',
			name: 'QLCChain Wallet Rep',
			trusted: true
		}
	];

	constructor() {
		this.representatives = this.defaultRepresentatives;
	}

	loadRepresentativeList() {
		if (this.loaded) {
			return this.representatives;
		}

		let list = this.defaultRepresentatives;
		const representativeStore = localStorage.getItem(this.storeKey);
		if (representativeStore) {
			list = JSON.parse(representativeStore);
		}
		this.representatives = list;
		this.representatives$.next(list);
		this.loaded = true;

		return list;
	}

	getRepresentative(id) {
		return this.representatives.find(rep => rep.id === id);
	}

	saveRepresentative(accountID, name, trusted = false, warn = false) {
		const newRepresentative: any = {
			id: accountID,
			name: name
		};
		if (trusted) {
			newRepresentative.trusted = true;
		}
		if (warn) {
			newRepresentative.warn = true;
		}

		const existingRepresentative = this.representatives.find(
			r => r.name.toLowerCase() === name.toLowerCase() || r.id.toLowerCase() === accountID.toLowerCase()
		);

		if (existingRepresentative) {
			this.representatives.splice(this.representatives.indexOf(existingRepresentative), 1, newRepresentative);
		} else {
			this.representatives.push(newRepresentative);
		}

		this.saveRepresentatives();
		this.representatives$.next(this.representatives);
	}

	deleteRepresentative(accountID) {
		const existingIndex = this.representatives.findIndex(a => a.id.toLowerCase() === accountID.toLowerCase());
		if (existingIndex === -1) {
			return;
		}

		this.representatives.splice(existingIndex, 1);

		this.saveRepresentatives();
		this.representatives$.next(this.representatives);
	}

	saveRepresentatives(): void {
		localStorage.setItem(this.storeKey, JSON.stringify(this.representatives));
	}

	getSortedRepresentatives() {
		const weightedReps = this.representatives.map(r => {
			if (r.trusted) {
				r.weight = 2;
			} else if (r.warn) {
				r.weight = 0;
			} else {
				r.weight = 1;
			}
			return r;
		});

		return weightedReps.sort((a, b) => b.weight - a.weight);
	}
}
