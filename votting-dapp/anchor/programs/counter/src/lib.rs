#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");

pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;
pub const MAX_CANDIDATE_ID: u64 = 999_999_999_999;
pub const MIN_CANDIDATE_ID: u64 = 999_999_999_99;

#[program]
pub mod counter {
    use super::*;

    pub fn init_candidate(ctx: Context<InitCandidate>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(candidate_id: u64)]
pub struct InitCandidate<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init,
        payer = user,
        space = ANCHOR_DISCRIMINATOR_SIZE + Candidate::INIT_SPACE,
        seeds = [b"candidate", user.key().as_ref(), &candidate_id.to_le_bytes()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    pub votes: u64,
    pub candidate_id: u64,
    pub total_votes: u64,
}

