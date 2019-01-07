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
	qlcTokenHash = '9bf0dd78eb52f56cf698990d7d3e4f0827de858f6bdabc7713c869482abfd914';
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
		return await this.request('qlcclassic_accountsBalances', { params: [accounts] });
	}

	async accountsFrontiers(accounts: string[]): Promise<{ frontiers: any; error?: string }> {
		return await this.request('qlcclassic_accountsFrontiers', { params: [accounts] });
	}

	async accountsPending(accounts: string[], count: number = 50): Promise<{ pending: any; error?: string }> {
		return await this.request('qlcclassic_accountsPending', { params: [[accounts], count] });
	}

	// Deprecated
	async delegatorsCount(account: string): Promise<{ count: string }> {
		return await this.request('delegators_count', { account });
	}

	async representativesOnline(): Promise<{ representatives: any }> {
		return await this.request('qlcclassic_representativesOnline', {});
	}

	async blocksInfo(blocks): Promise<{ blocks: any; error?: string }> {
		return await this.request('qlcclassic_blocksInfo', { params: [blocks] });
	}

	// Deprecated
	async blockCount(): Promise<{ count: number; unchecked: number }> {
		return await this.request('qlcclassic_blockCount', {});
	}

	async workGenerate(hash): Promise<{ work: string }> {
		return await this.request('qlcclassic_workGenerate', { params: [hash] });
	}

	async process(block): Promise<{ hash: string; error?: string }> {
		return await this.request('qlcclassic_process', { params: [block] });
	}

	async accountHistory(account, count = 25): Promise<{ history: any; error?: string }> {
		return await this.request('qlcclassic_accountHistoryTopn', { params: [account, count] });
	}

	async accountInfo(account): Promise<{ accountMeta: any; error?: string }> {
		return await this.request('qlcclassic_accountInfo', { params: [account] });
	}

	async validateAccountNumber(account): Promise<{ valid: '1' | '0' }> {
		return await this.request('qlcclassic_validateAccountNumber', { params: [account] });
	}

	async pending(account, count): Promise<{ pending: any; error?: string }> {
		return await this.accountsPending([account], count);
	}

	async tokens(): Promise<{ tokens: any; error?: string }> {
		return await this.request('qlcclassic_tokens', {});
	}

	async tokenByHash(tokenHash): Promise<any> {
		const tokens = await this.tokens();
		if (!tokens.error) {
			const tokenResult = tokens.tokens.result;
			return tokenResult.filter(token => {
				if (token.tokenId === tokenHash) {
					return token;
				}
			});
		}

		return null;
	}

	//TODO: remove token hash
	async accountInfoByToken(account, tokenHash = this.qlcTokenHash): Promise<any> {
		const am = await this.accountInfo(account);
		const tokens = am.accountMeta.result.tokens;

		return Array.isArray(tokens) ? tokens.filter(tokenMeta => tokenMeta.type === tokenHash)[0] : null;
	}
}
