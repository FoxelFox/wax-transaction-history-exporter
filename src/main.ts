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

	for (const t of transactions) {
		if (t.action_trace.act.name === "transfer") {
			try {


				const quantity = t.action_trace.act.data.quantity.split(" ");
				if (quantity[1] === "WAX") {

					if (txMap[t.action_trace.trx_id]) {
						continue;
					}

					if (t.action_trace.act.data.to === account) {
						// in
						sum += parseFloat(quantity[0]);
						records.push({
							type: "Einnahme",
							buy_amount: quantity[0],
							buy_currency: quantity[1],
							exchange: "WAX Transaction",
							date: t.block_time
						})
					} else {
						// out
						sum -= parseFloat(quantity[0]);
						records.push({
							type: "Ausgabe",
							sell_amount: quantity[0],
							sell_currency: quantity[1],
							exchange: "WAX Transaction",
							date: t.block_time
						})
					}
					txMap[t.action_trace.trx_id] = true;
				}
				if (sum < 0) {
					console.log(`Negative SUM: ${quantity}`)
					//break;
				}
			} catch (e) {
				console.log(`Failed at: ${t.account_action_seq}`)
			}

		}
	}
	console.log("SUM:", sum)
	await csvWriter.writeRecords(records);
}

async function main () {

	const transaction = await getTransactions();
	await toCSV(transaction);
	console.log(transaction.length)

}

main().then(() => console.log("done"))
