export interface Transaction {
	account_action_seq: number
	action_trace: {
		account_ram_deltas: RamDelta[]
		act: Act
		action_ordinal: number
		block_num: number
		block_time: string
		closest_unnotified_ancestor_action_ordinal: number
		context_free: boolean
		creator_action_ordinal: number
		elapsed: number
		producer_block_id: string
		receipt: Receipt
		receiver: string
		trx_id: string
	},
	block_num: number
	block_time: string
	global_action_seq: number
	irreversible: boolean
}

export interface RamDelta {
	account: string
	delta: number
}

export interface Act {
	account: string
	authorization: {
		actor: string,
		permission: "active" | "xfer"
	}[],
	data: any
	hex_data: string
	name: string
}

export interface Receipt {
	abi_sequence: number
	act_digest: string
	auth_sequence: [string, number][]
	code_sequence: number
	global_sequence: number
	receiver: string
	recv_sequence: number
}

export interface CSVRecord {
	type: "Einnahme" | "Ausgabe" | "Einzahlung" | "Auszahlung" | "Zinsen" | "Trade"
	buy_amount?: string
	buy_currency?: string
	sell_amount?: string
	sell_currency?: string
	fee?: string
	fee_currency?: string
	exchange?: string
	trade_group?: string
	comment?: string
	date: string
}

export interface Market {
	id: number
	base_token: Token
	quote_token: Token
	min_buy: string // like '0.0001 AETHER'
	min_sell: string // like '0.0001 DUST'
	frozen: number
	fee: number
	last_price: number
	volume24: number
	volumeWeek: number
	volumeMonth: number
	change24: number // %
	changeWeek: number // %
}

export interface Symbol {
	name: string
	precision: number
}

export interface Token {
	contract: string
	symbol: Symbol
	str: string
	supply?: number
	maxSupply?: number
	isuser?: string
}

export interface AlcorTrade {
	_id: string
	market: number
	type: "buymatch" | "sellmatch"
	trx_id: string // WAX trx_id
	unit_price: number
	ask: number
	bid: number
	bidder: string // WAX account
	time: string // ISO Date String
}
