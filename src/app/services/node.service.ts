import { Injectable } from '@angular/core';
import { NotificationService } from './notification.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';

@Injectable()
export class NodeService {

  node = {
    status: null, // null - loading, false - offline, true - online
  };

  msg1:string = '';

  constructor(private notifications: NotificationService,private trans: TranslateService) {
    this.loadLang();
    this.trans.onLangChange.subscribe((event: LangChangeEvent) => {
      this.loadLang();
    });
   }

   loadLang() {
    this.trans.get('SERVICE_WARNINGS_NODE.msg1').subscribe((res: string) => {
      console.log(res);
      this.msg1 = res;
    });
  }

  setOffline(message) {
    if (this.node.status === false) {
      return; // Already offline
    }
    this.node.status = false;

    const errMessage = message || this.msg1;
    this.notifications.sendError(errMessage, { identifier: 'node-offline', length: 0 });
  }

  setOnline() {
    if (this.node.status) {
      return; // Already online
    }

    this.node.status = true;
    this.notifications.removeNotification('node-offline');
  }
}
