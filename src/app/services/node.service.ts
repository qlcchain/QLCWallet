import { Injectable } from '@angular/core';
import { NotificationService } from './notification.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';

@Injectable({
	providedIn: 'root'
})
export class NodeService {
	status: boolean = null; // null - loading, false - offline, true - online

	msg1 = '';
	msg2 = 'Connecting to the node. Please wait.'; // Connecting to the node. Please wait.
	msg3 = 'Successfully connected to the node.'; // Successfully connected to the node.

	constructor(private notifications: NotificationService, private trans: TranslateService) {
		this.loadLang();
		this.trans.onLangChange.subscribe((event: LangChangeEvent) => {
			this.loadLang();
		});
		this.notifications.sendInfo(this.msg2, { identifier: 'node-connect', length: 0 });
	}

	loadLang() {
		this.trans.get('SERVICE_WARNINGS_NODE.msg1').subscribe((res: string) => {
			this.msg1 = res;
		});
	}

	setOffline(message) {
		if (this.status === false) {
			return; // Already offline
		}
		this.status = false; // Set offline

		const errMessage = message || this.msg1;
		this.notifications.sendError(errMessage, { identifier: 'node-offline', length: 0 });
	}

	setOnline() {
		if (this.status) {
			return; // Already online
		}

		this.status = true; // Set online
		this.notifications.removeNotification('node-offline'); // Remove offline msg
		this.notifications.removeNotification('node-connect'); // Remove connecting msg
		this.notifications.sendSuccess(this.msg3, { identifier: 'node-connected', length: 2000 }); // Send connected msg
	}
}
