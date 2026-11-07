use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, token, Env};

struct Fixture { env: Env, contract: Address, token: Address, donor: Address, owner: Address, recipient: Address, approver: Address }
impl Fixture {
    fn new() -> Self {
        let env = Env::default(); env.mock_all_auths(); env.ledger().with_mut(|l| { l.timestamp = 100; l.max_entry_ttl = 3_000_000; });
        let admin = Address::generate(&env);
        let token = env.register_stellar_asset_contract_v2(admin).address();
        let contract = env.register(ArceusEscrow, (token.clone(),));
        let donor = Address::generate(&env);
        token::StellarAssetClient::new(&env, &token).mint(&donor, &1000);
        Self { owner: Address::generate(&env), recipient: Address::generate(&env), approver: Address::generate(&env), env, contract, token, donor }
    }
    fn client(&self) -> ArceusEscrowClient<'_> { ArceusEscrowClient::new(&self.env, &self.contract) }
    fn create(&self) -> u64 { self.client().create(&self.owner, &self.recipient, &self.approver, &100, &1000) }
    fn balance(&self, address: &Address) -> i128 { token::Client::new(&self.env, &self.token).balance(address) }
}
#[test] fn valid_deposit_release() { let f = Fixture::new(); let id = f.create(); f.client().deposit(&id, &f.donor, &100); assert_eq!(f.balance(&f.contract), 100); f.client().release(&id); assert_eq!(f.balance(&f.recipient), 100); assert_eq!(f.client().get(&id).state, State::Released); }
#[test] fn zero_deposit_rejected() { let f = Fixture::new(); let id = f.create(); assert_eq!(f.client().try_deposit(&id, &f.donor, &0), Err(Ok(Error::Invalid))); }
#[test] fn negative_deposit_rejected() { let f = Fixture::new(); let id = f.create(); assert_eq!(f.client().try_deposit(&id, &f.donor, &-1), Err(Ok(Error::Invalid))); }
#[test] fn over_target_rejected() { let f = Fixture::new(); let id = f.create(); assert_eq!(f.client().try_deposit(&id, &f.donor, &101), Err(Ok(Error::Invalid))); }
#[test] fn incomplete_target_rejected() { let f = Fixture::new(); let id = f.create(); f.client().deposit(&id, &f.donor, &50); assert_eq!(f.client().try_release(&id), Err(Ok(Error::NotFunded))); }
#[test] fn cancelled_refund_once() { let f = Fixture::new(); let id = f.create(); f.client().deposit(&id, &f.donor, &70); f.client().cancel(&id); assert_eq!(f.client().refund(&id, &f.donor), 70); assert_eq!(f.balance(&f.donor), 1000); assert_eq!(f.client().try_refund(&id, &f.donor), Err(Ok(Error::NoRefund))); }
#[test] fn rejection_refund() { let f = Fixture::new(); let id = f.create(); f.client().deposit(&id, &f.donor, &100); f.client().reject(&id); assert_eq!(f.client().refund(&id, &f.donor), 100); assert_eq!(f.client().get(&id).remaining, 0); }
#[test] fn deadline_escape() { let f = Fixture::new(); let id = f.create(); f.client().deposit(&id, &f.donor, &50); f.env.ledger().with_mut(|l| l.timestamp = 1000); assert_eq!(f.client().refund(&id, &f.donor), 50); assert_eq!(f.client().try_deposit(&id, &f.donor, &50), Err(Ok(Error::Deadline))); }
#[test] fn early_refund_denied() { let f = Fixture::new(); let id = f.create(); f.client().deposit(&id, &f.donor, &50); assert_eq!(f.client().try_refund(&id, &f.donor), Err(Ok(Error::NoRefund))); }
#[test] fn repeated_release_denied() { let f = Fixture::new(); let id = f.create(); f.client().deposit(&id, &f.donor, &100); f.client().release(&id); assert_eq!(f.client().try_release(&id), Err(Ok(Error::Closed))); assert_eq!(f.client().try_refund(&id, &f.donor), Err(Ok(Error::Closed))); }
#[test] fn isolated_campaigns() { let f = Fixture::new(); let a = f.create(); let b = f.create(); f.client().deposit(&a, &f.donor, &100); f.client().deposit(&b, &f.donor, &30); f.client().cancel(&b); f.client().refund(&b, &f.donor); assert_eq!(f.balance(&f.contract), 100); f.client().release(&a); assert_eq!(f.balance(&f.recipient), 100); }
#[test] fn invalid_approver_denied() { let f = Fixture::new(); assert_eq!(f.client().try_create(&f.owner, &f.recipient, &f.recipient, &100, &1000), Err(Ok(Error::Invalid))); }
#[test] fn unauthorized_release_denied() { let f = Fixture::new(); let id = f.create(); f.client().deposit(&id, &f.donor, &100); f.env.mock_auths(&[]); assert!(f.client().try_release(&id).is_err()); assert_eq!(f.balance(&f.recipient), 0); }
#[test] fn unauthorized_deposit_denied() { let f = Fixture::new(); let id = f.create(); f.env.mock_auths(&[]); assert!(f.client().try_deposit(&id, &f.donor, &50).is_err()); assert_eq!(f.balance(&f.contract), 0); }
#[test] fn unauthorized_cancel_denied() { let f = Fixture::new(); let id = f.create(); f.env.mock_auths(&[]); assert!(f.client().try_cancel(&id).is_err()); }
#[test] fn unauthorized_refund_denied() { let f = Fixture::new(); let id = f.create(); f.client().deposit(&id, &f.donor, &50); f.client().cancel(&id); f.env.mock_auths(&[]); assert!(f.client().try_refund(&id, &f.donor).is_err()); }
#[test] fn insufficient_tokens_roll_back() { let f = Fixture::new(); let id = f.create(); let empty = Address::generate(&f.env); assert!(f.client().try_deposit(&id, &empty, &50).is_err()); assert_eq!(f.client().get(&id).deposited, 0); }