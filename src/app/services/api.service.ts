import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { NodeService } from './node.service';
import { NGXLogger } from 'ngx-logger';
@Injectable()
export class ApiService {
	rpcUrl = environment.apiUrl;
	// buff = new SharedArrayBuffer(32);
	// id = new Uint32Array(this.buff);
	id = 1;

	constructor(private http: HttpClient, private node: NodeService, private logger: NGXLogger) {
		this.logger.debug(this.rpcUrl);
		// this.id[0] = 1;
	}

	private async request(action, data): Promise<any> {
		data.jsonrpc = '2.0';
		data.method = action;
		data.id = this.id;
		this.id++;
		// data.id = Atomics.load(this.id, 0);
		console.log('requesting' + JSON.stringify(data));
		// Atomics.add(this.id, 0, 1);

		return await this.http
			.post(this.rpcUrl, data)
			.toPromise()
			.then(res => {
				this.node.setOnline();
				return res;
			})
			.catch(err => {
				if (err.status === 500 || err.status === 0) {
					this.node.setOffline(`${data.action}, ${err.message}: ${err.stack}`); // Hard error, node is offline
				}
				throw err;
			});
	}

	async accountsBalances(accounts: string[]): Promise<{ balances: any }> {
		return await this.request('qlcclassic_accountsBalances', { params: accounts });
	}
	async accountsFrontiers(accounts: string[]): Promise<{ frontiers: any; error?: string }> {
		return await this.request('qlcclassic_accountsFrontiers', { params: accounts });
	}
	async accountsPending(accounts: string[], count: number = 50): Promise<{ blocks: any }> {
		return await this.request('qlcclassic_accountsPending', { params: [accounts, count, true] });
	}
	async delegatorsCount(account: string): Promise<{ count: string }> {
		return await this.request('delegators_count', { account });
	}
	async representativesOnline(): Promise<{ representatives: any }> {
		return await this.request('qlcclassic_representativesOnline', {});
	}

	async blocksInfo(blocks): Promise<{ blocks: any; error?: string }> {
		return await this.request('qlcclassic_blocksInfo', { params: [blocks, true, true] });
	}
	async blockCount(): Promise<{ count: number; unchecked: number }> {
		return await this.request('qlcclassic_blockCount', {});
	}
	async workGenerate(hash): Promise<{ work: string }> {
		return await this.request('qlcclassic_workGenerate', { params: [hash] });
	}
	async process(block): Promise<{ hash: string; error?: string }> {
		return await this.request('qlcclassic_process', { params: [block] });
	}
	async accountHistory(account, count = 25, raw = false): Promise<{ history: any }> {
		return await this.request('qlcclassic_accountHistoryTopn', { params: [account, count, raw] });
	}
	async accountInfo(account): Promise<any> {
		return await this.request('qlcclassic_accountInfo', { params: [account, true, true, true] });
	}
	async validateAccountNumber(account): Promise<{ valid: '1' | '0' }> {
		return await this.request('qlcclassic_validateAccountNumber', { params: [account] });
	}
	async pending(account, count): Promise<any> {
		return await this.request('qlcclassic_pending', { params: [account, count, true] });
	}
	async tokens(): Promise<{ tokens: any; error?: string }> {
		return await this.request('qlcclassic_tokens', {});
	}

	// TODO: fix
	async tokenByName(token_name): Promise<{ token_info: any }> {
		const tokenRespone = await this.tokens();
		const tokens = tokenRespone.tokens;

		let token = null;

		Object.keys(tokens).map(token_hash => {
			if (tokens.token_hash.token_name === token_name) {
				token = tokens.token_hash;
				token.token_hash = token_hash;
			}
		});
		return token;
	}

	// TODO: fix
	async accountInfoByToken(account, tokenHash): Promise<any> {
		const account_infos = await this.accountInfo(account);
		const token_accounts = account_infos.account_infos;

		return Array.isArray(token_accounts)
			? token_accounts.filter(token_account => token_account.token_hash === tokenHash)[0]
			: null;
	}
}
