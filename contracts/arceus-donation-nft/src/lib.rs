#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env, Vec};

// Non-transferable, individually identified donation NFTs. Not a marketplace NFT interface.
// Payment and mint happen atomically: no issuer may mint from an unproven external hash.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Donation { pub id: u64, pub owner: Address, pub recipient: Address, pub amount: i128, pub created_at: u64 }
#[contracttype]
#[derive(Clone)]
enum Key { Token, Next, Item(u64), Count(Address), Owned(Address, u64) }
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error { Invalid = 1, Missing = 2, Overflow = 3 }
#[contract]
pub struct DonationNft;
const TTL: u32 = 1_000_000;
fn touch(e: &Env) { e.storage().instance().extend_ttl(100_000, TTL); }
fn read(e: &Env, id: u64) -> Result<Donation, Error> {
    let key = Key::Item(id);
    let value = e.storage().persistent().get(&key).ok_or(Error::Missing)?;
    e.storage().persistent().extend_ttl(&key, 100_000, TTL);
    Ok(value)
}
#[contractimpl]
impl DonationNft {
    pub fn __constructor(e: Env, token: Address) { e.storage().instance().set(&Key::Token, &token); touch(&e); }
    pub fn token(e: Env) -> Address { touch(&e); e.storage().instance().get(&Key::Token).unwrap() }
    pub fn donate(e: Env, donor: Address, recipient: Address, amount: i128) -> Result<u64, Error> {
        donor.require_auth();
        if amount <= 0 || donor == recipient || recipient == e.current_contract_address() { return Err(Error::Invalid); }
        touch(&e);
        let id: u64 = e.storage().instance().get(&Key::Next).unwrap_or(0);
        let next = id.checked_add(1).ok_or(Error::Overflow)?;
        let count_key = Key::Count(donor.clone());
        let count: u64 = e.storage().persistent().get(&count_key).unwrap_or(0);
        let new_count = count.checked_add(1).ok_or(Error::Overflow)?;
        token::Client::new(&e, &Self::token(e.clone())).transfer(&donor, &recipient, &amount);
        let nft = Donation { id, owner: donor.clone(), recipient, amount, created_at: e.ledger().timestamp() };
        let item_key = Key::Item(id);
        let owned_key = Key::Owned(donor, count);
        e.storage().persistent().set(&item_key, &nft);
        e.storage().persistent().set(&owned_key, &id);
        e.storage().persistent().set(&count_key, &new_count);
        for key in [item_key, owned_key, count_key] { e.storage().persistent().extend_ttl(&key, 100_000, TTL); }
        e.storage().instance().set(&Key::Next, &next);
        e.events().publish((soroban_sdk::symbol_short!("mint"), id), nft);
        Ok(id)
    }
    pub fn get(e: Env, id: u64) -> Result<Donation, Error> { touch(&e); read(&e, id) }
    pub fn owner_of(e: Env, id: u64) -> Result<Address, Error> { Ok(Self::get(e, id)?.owner) }
    pub fn balance(e: Env, owner: Address) -> u64 {
        touch(&e); let key = Key::Count(owner);
        let count = e.storage().persistent().get(&key).unwrap_or(0);
        if e.storage().persistent().has(&key) { e.storage().persistent().extend_ttl(&key, 100_000, TTL); }
        count
    }
    pub fn list(e: Env, owner: Address, start: u64, limit: u32) -> Result<Vec<Donation>, Error> {
        if limit == 0 || limit > 13 { return Err(Error::Invalid); }
        let end = core::cmp::min(start.checked_add(limit as u64).ok_or(Error::Overflow)?, Self::balance(e.clone(), owner.clone()));
        let mut rows = Vec::new(&e);
        for i in start..end {
            let key = Key::Owned(owner.clone(), i);
            let id = e.storage().persistent().get(&key).ok_or(Error::Missing)?;
            e.storage().persistent().extend_ttl(&key, 100_000, TTL);
            rows.push_back(read(&e, id)?);
        }
        Ok(rows)
    }
    pub fn keep_alive(e: Env) { touch(&e); }
}
#[cfg(test)]
mod test;