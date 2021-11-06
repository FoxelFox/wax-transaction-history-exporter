import {createObjectCsvWriter as createCsvWriter} from "csv-writer";
import {AlcorExchange} from "./alcor-exchange";
import {Wallet} from "./wallet";

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



async function main () {

	const wallet = new Wallet(account);
	const alcor = new AlcorExchange(account);


	const trades = await alcor.getTrades();
	const transactions = await wallet.getTransactions();

	const records = trades.concat(transactions).sort((a, b) => a.date.localeCompare(b.date))

	await csvWriter.writeRecords(records);

}

main().then(() => console.log("done"))
