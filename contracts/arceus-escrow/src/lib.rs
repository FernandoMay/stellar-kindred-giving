#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env, Symbol};

const TTL: u32 = 2_073_600; // ~120 days at 5 seconds per ledger; archival restoration still required.
const THRESHOLD: u32 = 172_800;
const MAX_DURATION: u64 = 7_776_000; // 90 days.

#[contracttype]
#[derive(Clone)]
pub enum Key { Token, Next, Campaign(u64), Donation(u64, Address) }
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum State { Funding, Released, Cancelled, Rejected }
#[contracttype]
#[derive(Clone, Debug)]
pub struct Campaign {
    pub owner: Address,
    pub recipient: Address,
    pub approver: Address,
    pub target: i128,
    pub deposited: i128,
    pub remaining: i128,
    pub deadline: u64,
    pub state: State,
}
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error { Invalid = 1, Missing = 2, Closed = 3, Deadline = 4, NotFunded = 5, NoRefund = 6, Overflow = 7 }

#[contract]
pub struct ArceusEscrow;

fn campaign(env: &Env, id: u64) -> Result<Campaign, Error> {
    let key = Key::Campaign(id);
    let result = env.storage().persistent().get(&key).ok_or(Error::Missing)?;
    env.storage().persistent().extend_ttl(&key, THRESHOLD, TTL);
    env.storage().instance().extend_ttl(THRESHOLD, TTL);
    Ok(result)
}
fn save(env: &Env, id: u64, c: &Campaign) {
    let key = Key::Campaign(id);
    env.storage().persistent().set(&key, c);
    env.storage().persistent().extend_ttl(&key, THRESHOLD, TTL);
    env.storage().instance().extend_ttl(THRESHOLD, TTL);
}
fn transfer(env: &Env, from: &Address, to: &Address, amount: i128) {
    let asset: Address = env.storage().instance().get(&Key::Token).unwrap();
    token::Client::new(env, &asset).transfer(from, to, &amount);
}
fn event(env: &Env, name: &str, id: u64, amount: i128) {
    env.events().publish((Symbol::new(env, name), id), amount);
}

#[contractimpl]
impl ArceusEscrow {
    /// Immutable single-asset contract. Pass ONLY the verified Testnet native XLM SAC.
    pub fn __constructor(env: Env, token: Address) {
        env.storage().instance().set(&Key::Token, &token);
        env.storage().instance().set(&Key::Next, &0u64);
        env.storage().instance().extend_ttl(THRESHOLD, TTL);
    }
    pub fn asset(env: Env) -> Address { env.storage().instance().get(&Key::Token).unwrap() }
    pub fn create(env: Env, owner: Address, recipient: Address, approver: Address, target: i128, deadline: u64) -> Result<u64, Error> {
        owner.require_auth();
        let now = env.ledger().timestamp();
        if target <= 0 || owner == approver || recipient == approver || recipient == env.current_contract_address()
            || deadline <= now || deadline - now > MAX_DURATION { return Err(Error::Invalid); }
        let id: u64 = env.storage().instance().get(&Key::Next).unwrap();
        env.storage().instance().set(&Key::Next, &id.checked_add(1).ok_or(Error::Overflow)?);
        save(&env, id, &Campaign { owner, recipient, approver, target, deposited: 0, remaining: 0, deadline, state: State::Funding });
        event(&env, "created", id, target);
        Ok(id)
    }
    pub fn get(env: Env, id: u64) -> Result<Campaign, Error> { campaign(&env, id) }
    pub fn deposit(env: Env, id: u64, donor: Address, amount: i128) -> Result<(), Error> {
        donor.require_auth();
        let mut c = campaign(&env, id)?;
        if c.state != State::Funding { return Err(Error::Closed); }
        if env.ledger().timestamp() >= c.deadline { return Err(Error::Deadline); }
        if amount <= 0 || donor == env.current_contract_address() { return Err(Error::Invalid); }
        let total = c.deposited.checked_add(amount).ok_or(Error::Overflow)?;
        if total > c.target { return Err(Error::Invalid); }
        let key = Key::Donation(id, donor.clone());
        let previous: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        let donated = previous.checked_add(amount).ok_or(Error::Overflow)?;
        c.deposited = total;
        c.remaining = c.remaining.checked_add(amount).ok_or(Error::Overflow)?;
        save(&env, id, &c);
        env.storage().persistent().set(&key, &donated);
        env.storage().persistent().extend_ttl(&key, THRESHOLD, TTL);
        transfer(&env, &donor, &env.current_contract_address(), amount);
        event(&env, "deposited", id, amount);
        Ok(())
    }
    /// Human approval is explicit, not an automatic assessment of deliverable quality.
    pub fn release(env: Env, id: u64) -> Result<(), Error> {
        let mut c = campaign(&env, id)?;
        c.approver.require_auth();
        if c.state != State::Funding { return Err(Error::Closed); }
        if env.ledger().timestamp() >= c.deadline { return Err(Error::Deadline); }
        if c.deposited != c.target { return Err(Error::NotFunded); }
        let amount = c.remaining;
        c.state = State::Released; c.remaining = 0;
        save(&env, id, &c);
        transfer(&env, &env.current_contract_address(), &c.recipient, amount);
        event(&env, "released", id, amount);
        Ok(())
    }
    pub fn cancel(env: Env, id: u64) -> Result<(), Error> {
        let mut c = campaign(&env, id)?; c.owner.require_auth();
        if c.state != State::Funding { return Err(Error::Closed); }
        c.state = State::Cancelled; save(&env, id, &c); event(&env, "cancelled", id, 0); Ok(())
    }
    pub fn reject(env: Env, id: u64) -> Result<(), Error> {
        let mut c = campaign(&env, id)?; c.approver.require_auth();
        if c.state != State::Funding { return Err(Error::Closed); }
        c.state = State::Rejected; save(&env, id, &c); event(&env, "rejected", id, 0); Ok(())
    }
    /// Each donor receives exactly their own contribution, once; no loops or admin sweep.
    pub fn refund(env: Env, id: u64, donor: Address) -> Result<i128, Error> {
        donor.require_auth(); let mut c = campaign(&env, id)?;
        if c.state == State::Released { return Err(Error::Closed); }
        if c.state == State::Funding && env.ledger().timestamp() < c.deadline { return Err(Error::NoRefund); }
        let key = Key::Donation(id, donor.clone());
        let amount: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        if amount <= 0 { return Err(Error::NoRefund); }
        c.remaining = c.remaining.checked_sub(amount).ok_or(Error::Overflow)?;
        if c.remaining < 0 { return Err(Error::Invalid); }
        env.storage().persistent().set(&key, &0i128);
        env.storage().persistent().extend_ttl(&key, THRESHOLD, TTL);
        save(&env, id, &c);
        transfer(&env, &env.current_contract_address(), &donor, amount);
        event(&env, "refunded", id, amount); Ok(amount)
    }
    /// Permissionless maintenance of known donor records; restoration is separate after archival.
    pub fn keep_alive(env: Env, id: u64, donor: Address) -> Result<(), Error> {
        campaign(&env, id)?;
        let key = Key::Donation(id, donor);
        if env.storage().persistent().has(&key) { env.storage().persistent().extend_ttl(&key, THRESHOLD, TTL); }
        Ok(())
    }
}

#[cfg(test)]
mod test;