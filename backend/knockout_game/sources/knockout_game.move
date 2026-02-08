module knockout_game::game {

    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use std::vector;
    use sui::sui::SUI;
    use sui::event;


    /* ================= Errors ================= */

    const E_NOT_AUTHORITY: u64 = 1;
    const E_MATCH_STARTED: u64 = 2;
    const E_MATCH_FULL: u64 = 3;
    const E_INVALID_PLAYER_COUNT: u64 = 4;
    const E_MATCH_NOT_STARTED: u64 = 5;
    const E_ALREADY_SETTLED: u64 = 6;
    const E_INVALID_WINNER: u64 = 7;
    const E_WRONG_ENTRY_FEE: u64 = 8;
    const E_NOT_PLAYER: u64 = 9;
    // Session-related errors
    const E_BAD_SESSION: u64 = 10;
    const E_SESSION_EXPIRED: u64 = 11;
    const E_ALREADY_JOINED: u64 = 12;
    const E_MATCH_NOT_FULL: u64 = 13;

    /* ================= Objects ================= */

    /// Session capability used by the off-chain game engine
    /// Enables signature-free gameplay during a session
    public struct SessionCap has key {
        id: UID,
        match_id: ID,
        player: address,
        expires_at_ms: u64,
    }

    /// Shared Match object holding escrow and players
    public struct Match has key {
        id: UID,
        authority: address,        // Game engine / oracle
        entry_fee: u64,
        max_players: u8,           // 4–8
        started: bool,
        settled: bool,
        players: vector<address>,
        escrow: Balance<SUI>,
    }

    /* ================= Entry Functions ================= */

    /// Create a new shared match
    public entry fun create_match(
    authority: address,
    entry_fee: u64,
    max_players: u8,
    payment: Coin<SUI>,
    ctx: &mut TxContext
) {
    assert!(max_players == 4, E_INVALID_PLAYER_COUNT);
    assert!(coin::value(&payment) == entry_fee, E_WRONG_ENTRY_FEE);

    let sender = tx_context::sender(ctx);

    let mut players = vector::empty<address>();
    vector::push_back(&mut players, sender);

    let mut escrow = balance::zero<SUI>();
    balance::join(&mut escrow, coin::into_balance(payment));

    let match_obj = Match {
        id: object::new(ctx),
        authority,
        entry_fee,
        max_players,
        started: false,
        settled: false,
        players,
        escrow,
    };

    let id = object::id(&match_obj);

    event::emit(MatchCreated {
        match_id: id,
        creator: sender,
        entry_fee,
        max_players,
    });

    transfer::share_object(match_obj);
}



    /// Join a match and lock funds into escrow
    /// Designed to be called inside a PTB
   public entry fun join_match(
    match_: &mut Match,
    payment: Coin<SUI>,
    ctx: &mut TxContext
) {
    assert!(!match_.started, E_MATCH_STARTED);
    assert!(
        (vector::length(&match_.players) as u8) < match_.max_players,
        E_MATCH_FULL
    );

    let sender = tx_context::sender(ctx);

    // 🚨 prevent duplicate joins
    assert!(!vector::contains(&match_.players, &sender), E_ALREADY_JOINED);

    assert!(coin::value(&payment) == match_.entry_fee, E_WRONG_ENTRY_FEE);

    balance::join(&mut match_.escrow, coin::into_balance(payment));
    vector::push_back(&mut match_.players, sender);

    event::emit(PlayerJoined {
        match_id: object::id(match_),
        player: sender,
    });

    if ((vector::length(&match_.players) as u8) == match_.max_players) {
        match_.started = true;

        event::emit(MatchStarted {
            match_id: object::id(match_),
        });
    }
}


    /// Mint a session capability for a player
    /// Used for signature-free gameplay off-chain
    public entry fun mint_session_cap(
        match_: &Match,
        duration_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(match_.started, E_MATCH_NOT_STARTED);
        assert!(!match_.settled, E_ALREADY_SETTLED);

        let player = tx_context::sender(ctx);
        assert!(vector::contains(&match_.players, &player), E_NOT_PLAYER);

        let cap = SessionCap {
            id: object::new(ctx),
            match_id: object::id(match_),
            player,
            expires_at_ms: clock::timestamp_ms(clock) + duration_ms,
        };

        transfer::transfer(cap, player);
    }

        public struct MatchCreated has copy, drop {
        match_id: ID,
        creator: address,
        entry_fee: u64,
        max_players: u8,
    }

    public struct PlayerJoined has copy, drop {
        match_id: ID,
        player: address,
    }

        public struct MatchStarted has copy, drop {
            match_id: ID,
        }

        public struct MatchFinished has copy, drop {
            match_id: ID,
            winner: address,
            prize: u64,
        }


    /// Validate a session capability against a match and clock
    /// Re-usable helper for gameplay functions (no signer required)
    public fun validate_session(
        cap: &SessionCap,
        match_: &Match,
        clock: &Clock
    ) {
        // ensure session is for this match
        assert!(cap.match_id == object::id(match_), E_BAD_SESSION);
        // ensure session hasn't expired
        assert!(clock::timestamp_ms(clock) < cap.expires_at_ms, E_SESSION_EXPIRED);
    }

    /// Example on-chain gameplay function that uses a session capability
    /// This function requires NO wallet signature and only validates the session
    public fun play_turn(
        cap: &SessionCap,
        match_: &Match,
        clock: &Clock
    ) {
        validate_session(cap, match_, clock);

        // On-chain we only check session validity. Actual game logic is handled off-chain
        // by the game engine which is authorized to use the session capability.
    }

    /// Final settlement — authority/oracle only
    /// Winner receives entire escrow
   public entry fun finish_match(
    match_: &mut Match,
    winner: address,
    ctx: &mut TxContext
) {
    assert!(
    (vector::length(&match_.players) as u8) == match_.max_players,
    E_MATCH_NOT_FULL
);
    assert!(!match_.settled, E_ALREADY_SETTLED);

    let caller = tx_context::sender(ctx);
    assert!(caller == match_.authority, E_NOT_AUTHORITY);
    assert!(vector::contains(&match_.players, &winner), E_INVALID_WINNER);

    match_.settled = true;

    let total = balance::value(&match_.escrow);
    let payout = balance::split(&mut match_.escrow, total);
    let coin = coin::from_balance(payout, ctx);

    transfer::public_transfer(coin, winner);

    event::emit(MatchFinished {
        match_id: object::id(match_),
        winner,
        prize: total,
    });
}

    public entry fun cancel_match(
    match_: &mut Match,
    ctx: &mut TxContext
) {
    assert!(!match_.started, E_MATCH_STARTED);
    assert!(!match_.settled, E_ALREADY_SETTLED);

    let caller = tx_context::sender(ctx);
    assert!(caller == match_.authority, E_NOT_AUTHORITY);

    let total = balance::value(&match_.escrow);
    let refund = balance::split(&mut match_.escrow, total);
    let coin = coin::from_balance(refund, ctx);

    transfer::public_transfer(coin, caller);

    match_.settled = true;
}

    /// Destroy session capability after match ends or expires
    public entry fun destroy_session_cap(cap: SessionCap) {
        let SessionCap { id, match_id: _, player: _, expires_at_ms: _ } = cap;
        object::delete(id);
    }
}
