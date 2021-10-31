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
