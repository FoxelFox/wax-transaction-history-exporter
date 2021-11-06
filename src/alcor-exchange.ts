
import axios from "axios";
import {AlcorTrade, CSVRecord, Market, Token} from "./interfaces";
import fs from "fs";

export class AlcorExchange {

	markets: {[id: number]: Market} = {};
	trades: AlcorTrade[];

	constructor(private account: string) {

	}

	async getTrades(): Promise<CSVRecord[]> {

		const csv: CSVRecord[] = [];

		await this.loadMarkets();
		await this.loadTrades();


		for (const trade of this.trades) {
			const line: CSVRecord = {
				type: "Trade",
				date: trade.time,
				exchange: "WAX Transaction"
			}
			// buy match = bid (in/buy, base) ask (out/sell, quote)
			// sell match = bid (in/buy, quote) ask (out/sell, base)

			const base = this.getTokenIdentifier(this.markets[trade.market].base_token);
			const quote = this.getTokenIdentifier(this.markets[trade.market].quote_token);
			const bid = trade.bid.toString();
			const ask = trade.ask.toString();

			if (trade.type === "buymatch") {
				line.buy_currency = base;
				line.buy_amount = bid;
				line.sell_currency = quote;
				line.sell_amount = ask;
			} else {
				line.buy_currency =  quote;
				line.buy_amount = bid;
				line.sell_currency = base;
				line.sell_amount = ask;
			}

			csv.push(line);
		}

		return csv;
	}

	async loadTrades() {
		if (fs.existsSync("trades.json")) {
			console.log("Using cached trades.json")
			this.trades = JSON.parse(fs.readFileSync("trades.json").toString());
		} else {

			// TODO this request is limited to 100000 trades
			const res = await axios.get<AlcorTrade[]>(`https://wax.alcor.exchange/api/account/${this.account}/deals?limit=100000&skip=0`)
			this.trades = res.data;

			fs.writeFileSync("trades.json", JSON.stringify(this.trades, undefined, "\t"))
		}
	}

	async loadMarkets() {
		console.log("Fetching Alcor Markets")
		const res = await axios.get<Market[]>(`https://wax.alcor.exchange/api/markets`);

		for (const m of res.data) {
			this.markets[m.id] = m;
		}

		// extend de listed markets

		// PORN
		this.markets[77] = {
			base_token: {
				"contract": "eosio.token",
				"symbol": {
					"name": "WAX",
					"precision": 8
				},
				"str": "WAX@eosio.token"
			},
			quote_token:  {
				"contract": "pornhubgames",
				"symbol": {
					"name": "PORN",
					"precision": 8
				},
				"str": "PORN@pornhubgames"
			}
		} as Market

		// WEED
		this.markets[51] = {
			base_token: {
				"contract": "eosio.token",
				"symbol": {
					"name": "WAX",
					"precision": 8
				},
				"str": "WAX@eosio.token"
			},
			quote_token:  {
				"contract": "createtokens",
				"symbol": {
					"name": "WEED",
					"precision": 8
				},
				"str": "WEED@createtokens"
			}
		} as Market
	}

	getTokenIdentifier(token: Token) {
		if (token.str === "WAX@eosio.token") {
			// well known and listed Token WAX (WAXP)
			return "WAX";
		} else if (token.str === "TLM@alien.worlds") {
			// well known and listed Token TLM from Alien Worlds
			return "TLM"
		} else {
			// in public its a unknown token and only available in the WAX Universe
			return token.str;
		}


	}
}
