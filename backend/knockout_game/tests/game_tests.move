#[test_only]
module knockout_game::game_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use knockout_game::game::{Self, Match, SessionCap};

    const ENTRY_FEE: u64 = 1000;

    #[test]
    fun test_complete_game() {
        let admin = @0xAD;
        let auth = @0xDE;
        let p1 = @0x1; let p2 = @0x2; let p3 = @0x3; let p4 = @0x4;

        let mut scenario = test_scenario::begin(admin);
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // 1. Setup Match
        game::create_match<SUI>(auth, ENTRY_FEE, 4, test_scenario::ctx(&mut scenario));

        // 2. Players Join (Simulating 4 Transactions)
        let players = vector[p1, p2, p3, p4];
        let mut i = 0;
        while (i < 4) {
            let addr = *vector::borrow(&players, i);
            test_scenario::next_tx(&mut scenario, addr);
            let mut m = test_scenario::take_shared<Match<SUI>>(&scenario);
            let pay = coin::mint_for_testing<SUI>(ENTRY_FEE, test_scenario::ctx(&mut scenario));
            game::join_match(&mut m, pay, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(m);
            i = i + 1;
        };

        // 3. Authority Finishes & P2 Wins
        test_scenario::next_tx(&mut scenario, auth);
        let mut m = test_scenario::take_shared<Match<SUI>>(&scenario);
        game::finish_match(&mut m, p2, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(m);

        // 4. Verification: winner should receive 4 * ENTRY_FEE
        test_scenario::next_tx(&mut scenario, p2);
        let prize = test_scenario::take_from_sender<Coin<SUI>>(&scenario);
        assert!(coin::value(&prize) == ENTRY_FEE * 4, 100);

        clock::destroy_for_testing(clock);
        test_scenario::return_to_address(p2, prize);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = knockout_game::game::E_NOT_AUTHORITY)]
    fun test_unauthorized_finish() {
        let admin = @0xAD;
        let hacker = @0x666;
        let p1 = @0x1; let p2 = @0x2; let p3 = @0x3; let p4 = @0x4;
        let mut scenario = test_scenario::begin(admin);

        // create and fill the match so it's in 'started' state
        game::create_match<SUI>(admin, ENTRY_FEE, 4, test_scenario::ctx(&mut scenario));

        let players = vector[p1, p2, p3, p4];
        let mut i = 0;
        while (i < 4) {
            let addr = *vector::borrow(&players, i);
            test_scenario::next_tx(&mut scenario, addr);
            let mut m = test_scenario::take_shared<Match<SUI>>(&scenario);
            let pay = coin::mint_for_testing<SUI>(ENTRY_FEE, test_scenario::ctx(&mut scenario));
            game::join_match(&mut m, pay, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(m);
            i = i + 1;
        };

        // Now the match is started; the hacker (non-authority) attempts to finish
        test_scenario::next_tx(&mut scenario, hacker);
        let mut m2 = test_scenario::take_shared<Match<SUI>>(&scenario);
        game::finish_match(&mut m2, hacker, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(m2);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = knockout_game::game::E_MATCH_STARTED)]
    fun test_room_capacity() {
        let admin = @0xAD;
        let auth = @0xDE;
        let p1 = @0x1; let p2 = @0x2; let p3 = @0x3; let p4 = @0x4; let p5 = @0x5;

        let mut scenario = test_scenario::begin(admin);
        game::create_match<SUI>(auth, ENTRY_FEE, 4, test_scenario::ctx(&mut scenario));

        // join first 4 players
        let players = vector[p1, p2, p3, p4, p5];
        let mut i = 0;
        while (i < 4) {
            let addr = *vector::borrow(&players, i);
            test_scenario::next_tx(&mut scenario, addr);
            let mut m = test_scenario::take_shared<Match<SUI>>(&scenario);
            let pay = coin::mint_for_testing<SUI>(ENTRY_FEE, test_scenario::ctx(&mut scenario));
            game::join_match(&mut m, pay, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(m);
            i = i + 1;
        };

        // attempt to add a 5th player — should abort with E_MATCH_FULL
        test_scenario::next_tx(&mut scenario, p5);
        let mut m2 = test_scenario::take_shared<Match<SUI>>(&scenario);
        let pay5 = coin::mint_for_testing<SUI>(ENTRY_FEE, test_scenario::ctx(&mut scenario));
        game::join_match(&mut m2, pay5, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(m2);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = knockout_game::game::E_WRONG_ENTRY_FEE)]
    fun test_fee_enforcement() {
        let admin = @0xAD;
        let auth = @0xDE;
        let p1 = @0x1;

        let mut scenario = test_scenario::begin(admin);
        game::create_match<SUI>(auth, ENTRY_FEE, 4, test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, p1);
        let mut m = test_scenario::take_shared<Match<SUI>>(&scenario);
        // pay wrong fee (e.g., 500)
        let pay = coin::mint_for_testing<SUI>(500, test_scenario::ctx(&mut scenario));
        game::join_match(&mut m, pay, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(m);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_session_lifecycle() {
        let admin = @0xAD;
        let auth = @0xDE;
        let p1 = @0x1; let p2 = @0x2; let p3 = @0x3; let p4 = @0x4;

        let mut scenario = test_scenario::begin(admin);
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // create match and join 4 players
        game::create_match<SUI>(auth, ENTRY_FEE, 4, test_scenario::ctx(&mut scenario));
        let players = vector[p1, p2, p3, p4];
        let mut i = 0;
        while (i < 4) {
            let addr = *vector::borrow(&players, i);
            test_scenario::next_tx(&mut scenario, addr);
            let mut m = test_scenario::take_shared<Match<SUI>>(&scenario);
            let pay = coin::mint_for_testing<SUI>(ENTRY_FEE, test_scenario::ctx(&mut scenario));
            game::join_match(&mut m, pay, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(m);
            i = i + 1;
        };

        // Mint a session cap for player 1 (player mints their own cap)
        test_scenario::next_tx(&mut scenario, p1);
        let mut m = test_scenario::take_shared<Match<SUI>>(&scenario);
        game::mint_session_cap(&m, 60000, &clock, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(m);

        // Player 1 receives the cap, uses it to play a turn
        test_scenario::next_tx(&mut scenario, p1);
        let cap = test_scenario::take_from_sender<SessionCap>(&scenario);

        // Validate and use the cap (player or engine calls play_turn)
        let mut m2 = test_scenario::take_shared<Match<SUI>>(&scenario);
        game::play_turn(&cap, &m2, &clock);
        test_scenario::return_shared(m2);

        // Destroy the session cap
        test_scenario::next_tx(&mut scenario, p1);
        game::destroy_session_cap(cap);

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = knockout_game::game::E_INVALID_PLAYER_COUNT)]
    fun test_invalid_player_count() {
        let admin = @0xAD;
        let mut scenario = test_scenario::begin(admin);

        // too few players (less than 4)
        game::create_match<SUI>(admin, ENTRY_FEE, 3, test_scenario::ctx(&mut scenario));

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = knockout_game::game::E_INVALID_WINNER)]
    fun test_invalid_winner() {
        let admin = @0xAD;
        let auth = @0xDE;
        let p1 = @0x1; let p2 = @0x2; let p3 = @0x3; let p4 = @0x4; let outsider = @0x99;

        let mut scenario = test_scenario::begin(admin);

        game::create_match<SUI>(auth, ENTRY_FEE, 4, test_scenario::ctx(&mut scenario));

        let players = vector[p1, p2, p3, p4];
        let mut i = 0;
        while (i < 4) {
            let addr = *vector::borrow(&players, i);
            test_scenario::next_tx(&mut scenario, addr);
            let mut m = test_scenario::take_shared<Match<SUI>>(&scenario);
            let pay = coin::mint_for_testing<SUI>(ENTRY_FEE, test_scenario::ctx(&mut scenario));
            game::join_match(&mut m, pay, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(m);
            i = i + 1;
        };

        test_scenario::next_tx(&mut scenario, auth);
        let mut m2 = test_scenario::take_shared<Match<SUI>>(&scenario);
        game::finish_match(&mut m2, outsider, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(m2);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = knockout_game::game::E_ALREADY_SETTLED)]
    fun test_already_settled() {
        let admin = @0xAD;
        let auth = @0xDE;
        let p1 = @0x1; let p2 = @0x2; let p3 = @0x3; let p4 = @0x4;

        let mut scenario = test_scenario::begin(admin);
        game::create_match<SUI>(auth, ENTRY_FEE, 4, test_scenario::ctx(&mut scenario));

        let players = vector[p1, p2, p3, p4];
        let mut i = 0;
        while (i < 4) {
            let addr = *vector::borrow(&players, i);
            test_scenario::next_tx(&mut scenario, addr);
            let mut m = test_scenario::take_shared<Match<SUI>>(&scenario);
            let pay = coin::mint_for_testing<SUI>(ENTRY_FEE, test_scenario::ctx(&mut scenario));
            game::join_match(&mut m, pay, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(m);
            i = i + 1;
        };

        // Finish once
        test_scenario::next_tx(&mut scenario, auth);
        let mut m2 = test_scenario::take_shared<Match<SUI>>(&scenario);
        game::finish_match(&mut m2, p1, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(m2);

        // Attempt to finish again -> E_ALREADY_SETTLED
        test_scenario::next_tx(&mut scenario, auth);
        let mut m3 = test_scenario::take_shared<Match<SUI>>(&scenario);
        game::finish_match(&mut m3, p1, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(m3);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = knockout_game::game::E_SESSION_EXPIRED)]
    fun test_session_expiry() {
        let admin = @0xAD;
        let auth = @0xDE;
        let p1 = @0x1; let p2 = @0x2; let p3 = @0x3; let p4 = @0x4;

        let mut scenario = test_scenario::begin(admin);
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // create match and join 4 players
        game::create_match<SUI>(auth, ENTRY_FEE, 4, test_scenario::ctx(&mut scenario));
        let players = vector[p1, p2, p3, p4];
        let mut i = 0;
        while (i < 4) {
            let addr = *vector::borrow(&players, i);
            test_scenario::next_tx(&mut scenario, addr);
            let mut m = test_scenario::take_shared<Match<SUI>>(&scenario);
            let pay = coin::mint_for_testing<SUI>(ENTRY_FEE, test_scenario::ctx(&mut scenario));
            game::join_match(&mut m, pay, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(m);
            i = i + 1;
        };

        // Mint a session cap with zero duration so it is immediately expired
        test_scenario::next_tx(&mut scenario, p1);
        let mut m = test_scenario::take_shared<Match<SUI>>(&scenario);
        game::mint_session_cap(&m, 0, &clock, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(m);

        // Player receives cap and attempts to use it -> should abort E_SESSION_EXPIRED
        test_scenario::next_tx(&mut scenario, p1);
        let cap = test_scenario::take_from_sender<SessionCap>(&scenario);
        let mut m2 = test_scenario::take_shared<Match<SUI>>(&scenario);
        game::play_turn(&cap, &m2, &clock);
        test_scenario::return_shared(m2);

        // consume/destroy the cap to satisfy move's non-drop rules
        test_scenario::next_tx(&mut scenario, p1);
        game::destroy_session_cap(cap);

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}
