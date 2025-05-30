use anchor_lang::prelude::*;

declare_id!("9bKZS2R4YmTYbgKywKsL3KAuVj2dyVJ63ZsuFw7RJ3GP");

pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod favorites {
    use super::*;

    pub fn set_favorite(ctx: Context<SetFavorite>, number: u64, color: String, hobby: String) -> Result<()> {
        let favorite = &mut ctx.accounts.favorite;
        if favorite.number == 0 && favorite.color == "" {
            favorite.number = number;
            favorite.color = color;
        } else {
            if favorite.number != number || favorite.color != color {
                return Err(ErrorCode::ParamsAlreadyExisting.into());
            }
        }

        if !favorite.hobbies.is_empty() && favorite.hobbies.iter().any(|h| h == &hobby) {
            return Err(ErrorCode::HobbyAlreadyExists.into());
        }

        favorite.hobbies.push(hobby);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(number: u64, color: String)]
pub struct SetFavorite<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = ANCHOR_DISCRIMINATOR_SIZE + Favorite::INIT_SPACE,
        seeds = [user.key().as_ref(), number.to_string().as_bytes(), color.as_bytes()],
        bump,
    )]  
    pub favorite: Account<'info, Favorite>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Favorite {
    pub number: u64,

    #[max_len(32)]
    pub color: String,

    #[max_len(10, 100)]  // Max 10 hobbies, each up to 100 chars
    pub hobbies: Vec<String>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid parameters")]
    ParamsAlreadyExisting,
    #[msg("Hobby already exists in the list")]
    HobbyAlreadyExists,
}