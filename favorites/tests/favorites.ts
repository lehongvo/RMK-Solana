import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { Favorites } from "../target/types/favorites";

describe("favorites", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const user = (provider.wallet as anchor.Wallet).payer;

  const program = anchor.workspace.favorites as Program<Favorites>;
  
  const favoriteNumber = new anchor.BN(1);
  const favoriteColor = Math.random().toString(36).substring(2, 12);
  const favoriteHobby = Math.random().toString(36).substring(2, 12);

  const [pdaOfUserAddress] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("favorites"),
      user.publicKey.toBuffer(),
      Buffer.from(favoriteNumber.toString()),
      Buffer.from(favoriteColor)
    ],
    program.programId
  );

  it("Should be check init data", async () => {
    expect(pdaOfUserAddress.toBase58().length > 0).to.be.equal(true);
    expect(program.programId.toBase58().length > 0).to.be.equal(true);
    expect(user.publicKey.toBase58().length > 0).to.be.equal(true);
    expect(favoriteNumber.toString().length > 0).to.be.equal(true);
    expect(favoriteColor.length > 0).to.be.equal(true);
    try {
      await program.account.favorite.fetch(pdaOfUserAddress);
      expect.fail("Expected account to not exist");
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it("Should be check set favorite", async () => {
    await program.methods.setFavorite(
      favoriteNumber, 
      favoriteColor, 
      favoriteHobby
    ).accounts({
      user: user.publicKey,
      favorite: pdaOfUserAddress,
    } as any).signers([user]).rpc();

    const favoriteAccount = await program.account.favorite.fetch(pdaOfUserAddress);
    expect(favoriteAccount.number.toString()).to.equal(favoriteNumber.toString());
    expect(favoriteAccount.color).to.equal(favoriteColor);
    expect(favoriteAccount.hobbies.length > 0).to.equal(true);
    expect(favoriteAccount.hobbies[favoriteAccount.hobbies.length-1]).to.equal(favoriteHobby);

    try {
      await program.methods.setFavorite(
        favoriteNumber, 
        favoriteColor, 
        favoriteHobby
      ).accounts({
        user: user.publicKey,
        favorite: pdaOfUserAddress,
      } as any).signers([user]).rpc();
      expect.fail("Expected error for unauthorized access");
    } catch (error) {
      expect(error).to.exist; 
    }
  });

  it("Should be check add hobby", async () => {
    const newHobby = Math.random().toString(36).substring(2, 12);
    const newFavoriteColor = Math.random().toString(36).substring(2, 12);
    const newNumber = new anchor.BN(2);

    const [pdaOfNewUserAddress] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("favorites"),
        user.publicKey.toBuffer(),
        Buffer.from(newNumber.toString()),
        Buffer.from(newFavoriteColor)
      ],
      program.programId
    );

    await program.methods.setFavorite(
      newNumber, 
      newFavoriteColor, 
      newHobby
    ).accounts({
      user: user.publicKey,
      favorite: pdaOfNewUserAddress,
    } as any).signers([user]).rpc();
    const favoriteAccount = await program.account.favorite.fetch(pdaOfNewUserAddress);
    const lengthBefore = favoriteAccount.hobbies.length;

    const newHobbyV1 = Math.random().toString(36).substring(2, 12);
    await program.methods.setFavorite(
      newNumber,
      newFavoriteColor,
      newHobbyV1
    ).accounts({
      user: user.publicKey,
      favorite: pdaOfNewUserAddress,
    } as any).signers([user]).rpc();

    const updatedFavoriteAccount = await program.account.favorite.fetch(pdaOfNewUserAddress);
    expect(updatedFavoriteAccount.hobbies.length).to.equal(lengthBefore + 1);
    expect(updatedFavoriteAccount.hobbies[lengthBefore]).to.equal(newHobbyV1);
  });
});
