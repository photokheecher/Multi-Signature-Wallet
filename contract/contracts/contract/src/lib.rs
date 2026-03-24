#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Vec
};

#[contract]
pub struct MultiSigWallet;

#[contracttype]
#[derive(Clone)]
pub struct Transaction {
    pub to: Address,
    pub amount: i128,
    pub approvals: Vec<Address>,
    pub executed: bool,
}

#[contracttype]
pub enum DataKey {
    Owners,
    Threshold,
    TxCount,
    Transactions(u32),
}

#[contractimpl]
impl MultiSigWallet {

    pub fn initialize(env: Env, owners: Vec<Address>, threshold: u32) {
        if env.storage().instance().has(&DataKey::Owners) {
            panic!("Already initialized");
        }

        if threshold == 0 || threshold > owners.len() {
            panic!("Invalid threshold");
        }

        env.storage().instance().set(&DataKey::Owners, &owners);
        env.storage().instance().set(&DataKey::Threshold, &threshold);
        env.storage().instance().set(&DataKey::TxCount, &0u32);
    }

    pub fn submit_tx(env: Env, to: Address, amount: i128) -> u32 {
        let mut tx_count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TxCount)
            .unwrap();

        let tx = Transaction {
            to,
            amount,
            approvals: Vec::new(&env),
            executed: false,
        };

        env.storage()
            .instance()
            .set(&DataKey::Transactions(tx_count), &tx);

        tx_count += 1;
        env.storage().instance().set(&DataKey::TxCount, &tx_count);

        tx_count - 1
    }

    pub fn approve_tx(env: Env, tx_id: u32, approver: Address) {
        let mut tx: Transaction = env
            .storage()
            .instance()
            .get(&DataKey::Transactions(tx_id))
            .unwrap();

        let owners: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Owners)
            .unwrap();

        if !owners.contains(&approver) {
            panic!("Not an owner");
        }

        if tx.executed {
            panic!("Already executed");
        }

        if tx.approvals.contains(&approver) {
            panic!("Already approved");
        }

        tx.approvals.push_back(approver);

        env.storage()
            .instance()
            .set(&DataKey::Transactions(tx_id), &tx);
    }

    pub fn execute_tx(env: Env, tx_id: u32) {
        let mut tx: Transaction = env
            .storage()
            .instance()
            .get(&DataKey::Transactions(tx_id))
            .unwrap();

        let threshold: u32 = env
            .storage()
            .instance()
            .get(&DataKey::Threshold)
            .unwrap();

        if tx.executed {
            panic!("Already executed");
        }

        if tx.approvals.len() < threshold {
            panic!("Not enough approvals");
        }

        // NOTE: This is just an event, not real transfer
        env.events().publish(
            (symbol_short!("execute"), tx_id),
            (tx.to.clone(), tx.amount),
        );

        tx.executed = true;

        env.storage()
            .instance()
            .set(&DataKey::Transactions(tx_id), &tx);
    }
}