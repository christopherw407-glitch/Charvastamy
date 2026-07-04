
use {
    anchor_lang::{
        prelude::Pubkey,
        solana_program::{
            instruction::{AccountMeta, Instruction},
            system_program,
        },
        AccountDeserialize, InstructionData,
    },
    litesvm::LiteSVM,
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

#[test]
fn test_initialize() {
    let program_id = charvastamy::id();
    let payer = Keypair::new();
    let mut svm = LiteSVM::new();
    let bytes = include_bytes!("../../../target/deploy/charvastamy.so");
    svm.add_program(program_id, bytes).unwrap();
    svm.airdrop(&payer.pubkey(), 1_000_000_000).unwrap();

    let (state_pda, bump) = Pubkey::find_program_address(
        &[b"state", payer.pubkey().as_ref()],
        &program_id,
    );

    let instruction = Instruction::new_with_bytes(
        program_id,
        &charvastamy::instruction::Initialize {}.data(),
        vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new(state_pda, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    );

    let authority = payer.pubkey();
    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[instruction], Some(&authority), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[payer]).unwrap();

    let res = svm.send_transaction(tx);
    assert!(res.is_ok());

    let state_account = svm.get_account(&state_pda).unwrap();
    let mut data = state_account.data.as_slice();
    let state = charvastamy::state::ProgramState::try_deserialize(&mut data).unwrap();

    assert_eq!(state.authority, authority);
    assert_eq!(state.count, 0);
    assert_eq!(state.bump, bump);
}

#[test]
fn test_increment_updates_count() {
    let program_id = charvastamy::id();
    let payer = Keypair::new();
    let mut svm = LiteSVM::new();
    let bytes = include_bytes!("../../../target/deploy/charvastamy.so");
    svm.add_program(program_id, bytes).unwrap();
    svm.airdrop(&payer.pubkey(), 1_000_000_000).unwrap();

    let (state_pda, _) = Pubkey::find_program_address(
        &[b"state", payer.pubkey().as_ref()],
        &program_id,
    );

    let initialize_instruction = Instruction::new_with_bytes(
        program_id,
        &charvastamy::instruction::Initialize {}.data(),
        vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new(state_pda, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    );

    let authority = payer.pubkey();
    let init_blockhash = svm.latest_blockhash();
    let init_msg = Message::new_with_blockhash(&[initialize_instruction], Some(&authority), &init_blockhash);
    let init_tx = VersionedTransaction::try_new(VersionedMessage::Legacy(init_msg), &[payer.insecure_clone()]).unwrap();
    let init_res = svm.send_transaction(init_tx);
    assert!(init_res.is_ok());

    let increment_instruction = Instruction::new_with_bytes(
        program_id,
        &charvastamy::instruction::Increment {}.data(),
        vec![
            AccountMeta::new(authority, true),
            AccountMeta::new(state_pda, false),
        ],
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[increment_instruction], Some(&authority), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[payer]).unwrap();

    let res = svm.send_transaction(tx);
    assert!(res.is_ok());

    let state_account = svm.get_account(&state_pda).unwrap();
    let mut data = state_account.data.as_slice();
    let state = charvastamy::state::ProgramState::try_deserialize(&mut data).unwrap();

    assert_eq!(state.count, 1);
}
