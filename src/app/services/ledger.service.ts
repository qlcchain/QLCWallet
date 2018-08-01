import { Injectable } from '@angular/core';
// import Nano from 'hw-app-nano';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import { Subject } from 'rxjs/Subject';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';

export const STATUS_CODES = {
  /**
   * Security status not satisfied is returned when the
   * device is still locked
   */
  SECURITY_STATUS_NOT_SATISFIED: 0x6982,
  /**
   * Conditions of use not satisfied is returned when the
   * user declines the request to complete the action.
   */
  CONDITIONS_OF_USE_NOT_SATISFIED: 0x6985,
  /**
   * Failed to verify the provided signature.
   */
  INVALID_SIGNATURE: 0x6a81,
  /**
   * Parent block data was not found in cache.
   */
  CACHE_MISS: 0x6a82
};

export const LedgerStatus = {
  NOT_CONNECTED: 'not-connected',
  LOCKED: 'locked',
  READY: 'ready',
};


export interface LedgerData {
  status: string;
  nano: any | null;
  transport: any | null;
}

@Injectable()
export class LedgerService {
  walletPrefix = `44'/165'/`;

  waitTimeout = 300000;
  normalTimeout = 5000;
  pollInterval = 15000;

  pollingLedger = false;

  ledger: LedgerData = {
    status: LedgerStatus.NOT_CONNECTED,
    nano: null,
    transport: null,
  };

  ledgerStatus$ = new Subject();

  constructor(private api: ApiService, private notifications: NotificationService) { }

  resetLedger() {
    // console.log(`Resetting ledger device`);
    this.ledger.transport = null;
    this.ledger.nano = null;
  }

  async loadLedger(hideNotifications = false) {
    return new Promise(async (resolve, reject) => {
      // Load the transport object
      if (!this.ledger.transport) {
        try {
          this.ledger.transport = await TransportU2F.open(null);
          this.ledger.transport.setExchangeTimeout(this.waitTimeout); // 5 minutes
        } catch (err) {
          if (err.statusText === 'UNKNOWN_ERROR') {
            this.resetLedger();
          }
          this.ledgerStatus$.next(this.ledger.status);
          return resolve(false);
        }
      }

      // Load nano object
      if (!this.ledger.nano) {
        try {
          // this.ledger.nano = new Nano(this.ledger.transport);
          this.ledger.nano = null;
        } catch (err) {
          if (err.statusText === 'UNKNOWN_ERROR') {
            this.resetLedger();
          }
          this.ledgerStatus$.next(this.ledger.status);
          return resolve(false);
        }
      }

      let resolved = false;
      if (this.ledger.status === LedgerStatus.READY) {
        return resolve(true); // Already ready?
      }

      // Set up a timeout when things are not ready
      setTimeout(() => {
        if (!resolved) {
          this.ledger.status = LedgerStatus.NOT_CONNECTED;
          this.ledgerStatus$.next(this.ledger.status);
          if (!hideNotifications) {
            const warnMessage = 'Unable to connect to the Ledger device.  Make sure it is unlocked and the Nano application is open';
            this.notifications.sendWarning(warnMessage);
          }
          resolved = true;
          return resolve(false);
        }
      }, 2500);

      // Try to load the app config
      try {
        const ledgerConfig = await this.ledger.nano.getAppConfiguration();
        resolved = true;
        if (!ledgerConfig || !ledgerConfig) {
          return resolve(false);
        }
        if (ledgerConfig && ledgerConfig.version) {
          this.ledger.status = LedgerStatus.LOCKED;
          this.ledgerStatus$.next(this.ledger.status);
        }
      } catch (err) {
        if (err.statusText === 'HALTED') {
          this.resetLedger();
        }
        if (!hideNotifications && !resolved) {
          const warnMessage = `Ledger device locked.  Unlock and open the Nano application`;
          this.notifications.sendWarning(warnMessage);
        }
        return resolve(false);
      }

      // Attempt to load account 0 - which confirms the app is unlocked and ready
      try {
        const accountDetails = await this.getLedgerAccount(0);
        this.ledger.status = LedgerStatus.READY;
        this.ledgerStatus$.next(this.ledger.status);

        if (!this.pollingLedger) {
          this.pollingLedger = true;
          this.pollLedgerStatus();
        }
      } catch (err) {
        if (err.statusCode === STATUS_CODES.SECURITY_STATUS_NOT_SATISFIED) {
          if (!hideNotifications) {
            const warnMessage = `Ledger device locked.  Unlock and open the Nano application`;
            this.notifications.sendWarning(warnMessage);
          }
        }
      }

      resolve(true);
    }).catch(err => {
      console.log(`error when loading ledger `, err);
      if (!hideNotifications) {
        const warnMessage = `Error loading Ledger device: ${err.message}`;
        this.notifications.sendWarning(warnMessage);
      }
    });

  }

  async updateCache(accountIndex, blockHash) {
    if (this.ledger.status !== LedgerStatus.READY) {
      await this.loadLedger(); // Make sure ledger is ready
    }
    const blockResponse = await this.api.blocksInfo([blockHash]);
    const blockData = blockResponse.blocks[blockHash];
    if (!blockData) {
      throw new Error(`Unable to load block data`);
    }
    blockData.contents = JSON.parse(blockData.contents);

    const cacheData = {
      representative: blockData.contents.representative,
      balance: blockData.contents.balance,
      previousBlock: blockData.contents.previous === '0000000000000000000000000000000000000000000000000000000000000000'
        ? null : blockData.contents.previous,
      sourceBlock: blockData.contents.link,
    };

    const cacheResponse = await this.ledger.nano.cacheBlock(this.ledgerPath(accountIndex), cacheData, blockData.contents.signature);

    return cacheResponse;
  }

  async signBlock(accountIndex: number, blockData: any) {
    if (this.ledger.status !== LedgerStatus.READY) {
      await this.loadLedger(); // Make sure ledger is ready
    }
    this.ledger.transport.setExchangeTimeout(this.waitTimeout);
    return await this.ledger.nano.signBlock(this.ledgerPath(accountIndex), blockData);
  }

  ledgerPath(accountIndex: number) {
    return `${this.walletPrefix}${accountIndex}'`;
  }

  async getLedgerAccount(accountIndex: number, showOnScreen = false) {
    this.ledger.transport.setExchangeTimeout(showOnScreen ? this.waitTimeout : this.normalTimeout);
    try {
      return await this.ledger.nano.getAddress(this.ledgerPath(accountIndex), showOnScreen);
    } catch (err) {
      throw err;
    }
  }

  pollLedgerStatus() {
    if (this.pollingLedger) {
      setTimeout(async () => {
        await this.checkLedgerStatus();
        this.pollLedgerStatus();
      }, this.pollInterval);
    }
  }

  async checkLedgerStatus() {
    if (this.ledger.status !== LedgerStatus.READY) {
      return;
    }

    try {
      const accountDetails = await this.getLedgerAccount(0);
      this.ledger.status = LedgerStatus.READY;
    } catch (err) {
      this.ledger.status = LedgerStatus.NOT_CONNECTED;
      this.pollingLedger = false;
    }

    this.ledgerStatus$.next(this.ledger.status);
  }

}
