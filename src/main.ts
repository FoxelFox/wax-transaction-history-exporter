import axios from "axios";
import * as fs from "fs";
import {Transaction} from "./interfaces";

const account = process.argv[2];

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

function filter_rs(transactions: Transaction[]) {

}

async function main () {

	const transaction = await getTransactions();
	console.log(transaction.length)

}

main().then(() => console.log("done"))
