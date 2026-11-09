use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
struct Fixture { e: Env, contract: Address, token: Address, donor: Address, recipient: Address }
impl Fixture {
    fn new() -> Self {
        let e = Env::default(); e.mock_all_auths(); e.ledger().with_mut(|l| { l.timestamp = 100; l.max_entry_ttl = 3_000_000; });
        let token = e.register_stellar_asset_contract_v2(Address::generate(&e)).address();
        let contract = e.register(DonationNft, (token.clone(),));
        let donor = Address::generate(&e); let recipient = Address::generate(&e);
        token::StellarAssetClient::new(&e, &token).mint(&donor, &100_000_000);
        Self { e, contract, token, donor, recipient }
    }
    fn client(&self) -> DonationNftClient<'_> { DonationNftClient::new(&self.e, &self.contract) }
}
#[test] fn payment_and_nft_are_atomic() { let f = Fixture::new(); let id = f.client().donate(&f.donor, &f.recipient, &10_000_001); assert_eq!(token::Client::new(&f.e, &f.token).balance(&f.recipient), 10_000_001); assert_eq!(f.client().owner_of(&id), f.donor); assert_eq!(f.client().get(&id).amount, 10_000_001); assert_eq!(f.client().balance(&f.donor), 1); }
#[test] fn distinct_ids_for_distinct_donations() { let f = Fixture::new(); assert_eq!(f.client().donate(&f.donor, &f.recipient, &1), 0); assert_eq!(f.client().donate(&f.donor, &f.recipient, &1), 1); assert_eq!(f.client().list(&f.donor, &0, &13).len(), 2); }
#[test] fn no_authorization_no_nft() { let f = Fixture::new(); f.e.mock_auths(&[]); assert!(f.client().try_donate(&f.donor, &f.recipient, &1).is_err()); assert_eq!(f.client().balance(&f.donor), 0); }
#[test] fn insufficient_funds_no_nft() { let f = Fixture::new(); assert!(f.client().try_donate(&f.donor, &f.recipient, &100_000_001).is_err()); assert_eq!(f.client().balance(&f.donor), 0); assert_eq!(token::Client::new(&f.e, &f.token).balance(&f.recipient), 0); }
#[test] fn invalid_amounts() { let f = Fixture::new(); for amount in [0, -1] { assert_eq!(f.client().try_donate(&f.donor, &f.recipient, &amount), Err(Ok(Error::Invalid))); } }
#[test] fn cannot_self_donate() { let f = Fixture::new(); assert_eq!(f.client().try_donate(&f.donor, &f.donor, &1), Err(Ok(Error::Invalid))); }
#[test] fn cannot_send_to_contract() { let f = Fixture::new(); assert_eq!(f.client().try_donate(&f.donor, &f.contract, &1), Err(Ok(Error::Invalid))); }
#[test] fn owner_isolated() { let f = Fixture::new(); f.client().donate(&f.donor, &f.recipient, &1); assert_eq!(f.client().list(&f.recipient, &0, &13).len(), 0); }
#[test] fn missing_id() { let f = Fixture::new(); assert_eq!(f.client().try_get(&42), Err(Ok(Error::Missing))); }
#[test] fn pagination_limits() { let f = Fixture::new(); assert_eq!(f.client().try_list(&f.donor, &0, &14), Err(Ok(Error::Invalid))); assert_eq!(f.client().try_list(&f.donor, &0, &0), Err(Ok(Error::Invalid))); }