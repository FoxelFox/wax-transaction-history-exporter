import fs from "fs";
import axios from "axios";
import {CSVRecord, Transaction} from "./interfaces";

export class Wallet {

	transactions: Transaction[];

	constructor(private account) {

	}

	async getTransactions(): Promise<CSVRecord[]> {
		await this.loadTransactions();

		const records: CSVRecord[] = [];
		let sum = 0;
		const txMap = {}
		let duplicates = 0

		for (const t of this.transactions) {
			if (txMap[t.action_trace.trx_id]) {
				duplicates++;
				continue; // duplicate tx
			}


			const result = this.getTransactionResult(t);

			if (result ) {
				let change = 0;
				if (result.buy_amount) {
					change += parseFloat(result.buy_amount)
				} else if (result.sell_amount) {
					change -= parseFloat(result.sell_amount)
				} else {
					console.log(`No Result with no change at ${t.account_action_seq}`)
				}
				txMap[t.action_trace.trx_id] = true;
				sum += change;

				// if (change > 20 || change < -20) {
				// 	result['debug'] = t.account_action_seq
				records.push(result)
				//}

			} else {
				// console.log(`No Result at ${t.account_action_seq}`)
			}

		}
		console.log("SUM:", sum)
		console.log("duplicates", duplicates)
		return records;
	}

	async loadTransactions() {
		this.transactions = []

		if (fs.existsSync("transactions.json")) {
			console.log("Using cached transactions.json")
			this.transactions = JSON.parse(fs.readFileSync("transactions.json").toString());
		} else {
			try {
				for (let i = 0; i < 1000; i++) {
					const res = await axios.post(`https://wax.greymass.com/v1/history/get_actions`, {
						account_name: this.account,
						offset: 100,
						pos: i * 100
					});
					this.transactions = this.transactions.concat(res.data.actions)
					console.log(`Fetched ${this.transactions.length} so far...`)
				}
			} catch (e) {
				// end reached
			}
			fs.writeFileSync("transactions.json", JSON.stringify(this.transactions, undefined, "\t"))
		}
	}

	getTransactionResult(transaction: Transaction) {
		const act = transaction.action_trace.act;
		let ret: CSVRecord = {
			date: new Date(transaction.block_time + `-01:00` ).toISOString(), // TODO FIX THIS SHIT TIMEZONES
			exchange: "WAX Transaction"
		} as CSVRecord

		// Claim Stake Reward (going directly to cpu and net)
		if (act.name === "delegatebw" && act.data.from === "eosio.voters" ) {
			ret.type = "Zinsen";
			let result = 0;
			result += parseFloat(act.data.stake_cpu_quantity.split(" ")[0])
			result += parseFloat(act.data.stake_net_quantity.split(" ")[0])
			ret.buy_amount = result.toString();
			ret.buy_currency = "WAX";
			return ret;
		}

		// Just Staking
		if (act.name === "delegatebw" && act.data.from === this.account) {
			return
		}

		// Transfer
		if (
			act.name === "transfer" && act.data.quantity
			&& act.data.to !== "eosio.stake" // just staking
			&& act.data.to !== "alcordexmain" // ignore order movements because they handled by AlcorExchange class
			&& act.data.from !== "alcordexmain" // ignore order movements  because they handled by AlcorExchange class
		) {
			const quantity = act.data.quantity.split(" ");
			if (quantity[1] === "WAX") {
				if (act.data.to === this.account) {
					//ret.type = "Einnahme"
					ret.type = "Einzahlung"
					ret.buy_amount = quantity[0];
					ret.buy_currency = quantity[1]
				} else {
					//ret.type = "Ausgabe"
					ret.type = "Auszahlung"
					ret.sell_amount = quantity[0];
					ret.sell_currency = quantity[1]
				}
				return ret;
			}
		}
	}
}
