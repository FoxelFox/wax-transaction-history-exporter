import axios from "axios";
import * as fs from "fs";
import {CSVRecord, Transaction} from "./interfaces";
import {createObjectCsvWriter as createCsvWriter} from "csv-writer";

const account = process.argv[2];
const csvWriter = createCsvWriter({
	path: 'output.csv',
	header: [
		{id: 'type', title: 'Type'},
		{id: 'buy_amount', title: 'Buy Amount'},
		{id: 'buy_currency', title: 'Buy Currency'},
		{id: 'sell_amount', title: 'Sell Amount'},
		{id: 'sell_currency', title: 'Sell Currency'},
		{id: 'fee', title: 'Fee'},
		{id: 'fee_currency', title: 'Fee Currency'},
		{id: 'exchange', title: 'Exchange'},
		{id: 'trade_group', title: 'Trade-Group'},
		{id: 'comment', title: 'Comment'},
		{id: 'date', title: 'Date'},
		//{id: 'debug', title: 'Debug'},
	]
});

async function getTransactions(): Promise<Transaction[]> {

	let transactions = []

	if (fs.existsSync("transactions.json")) {
		console.log("Using cached transactions.json")
		transactions = JSON.parse(fs.readFileSync("transactions.json").toString());
	} else {
		try {
			for (let i = 0; i < 1000; i++) {
				const res = await axios.post(`https://wax.greymass.com/v1/history/get_actions`, {
					account_name: account,
					offset: 100,
					pos: i * 100
				});
				transactions = transactions.concat(res.data.actions)
				console.log(`Fetched ${transactions.length} so far...`)
			}
		} catch (e) {
			// end reached
		}
		fs.writeFileSync("transactions.json", JSON.stringify(transactions, undefined, "\t"))
	}

	return transactions;
}

async function toCSV(transactions: Transaction[]) {

	const records: CSVRecord[] = [];
	let sum = 0;
	const txMap = {}
	let duplicates = 0

	for (const t of transactions) {
		if (txMap[t.action_trace.trx_id]) {
			duplicates++;
			continue; // duplicate tx
		}


		const result = getTransactionResult(t);

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
	await csvWriter.writeRecords(records);
}

function getTransactionResult(transaction: Transaction) {
	const act = transaction.action_trace.act;
	let ret: CSVRecord = {
		date: transaction.block_time
	} as CSVRecord

	// Claim Stake Reward (going directly to cpu and net)
	if (act.name === "delegatebw" && act.data.from === "eosio.voters" ) {
		ret.type = "Zinsen";
		let result = 0;
		result += parseFloat(act.data.stake_cpu_quantity.split(" ")[0])
		result += parseFloat(act.data.stake_net_quantity.split(" ")[0])
		ret.buy_amount = result.toString();
		return ret;
	}

	// Just Staking
	if (act.name === "delegatebw" && act.data.from === account) {
		return
	}

	// Transfer
	if (act.name === "transfer" && act.data.quantity && act.data.to !== "eosio.stake") {
		const quantity = act.data.quantity.split(" ");
		if (quantity[1] === "WAX") {
			if (act.data.to === account) {
				ret.type = "Einnahme"
				ret.buy_amount = quantity[0];
				ret.buy_currency = quantity[1]
			} else {
				ret.type = "Ausgabe"
				ret.sell_amount = quantity[0];
				ret.sell_currency = quantity[1]
			}
			return ret;
		}
	}
}

async function main () {

	const transaction = await getTransactions();
	await toCSV(transaction);
	console.log(transaction.length)

}

main().then(() => console.log("done"))
