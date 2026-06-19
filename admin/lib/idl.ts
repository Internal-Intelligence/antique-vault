export const IDL = {
  address: "FnYhRhWkpALRFhm59FSmUeEaCRLvtQCXV2PVL5Hiz3WL",
  version: "0.1.0",
  name: "antique_vault",
  instructions: [
    {
      name: "initializeVault",
      accounts: [
        { name: "vault", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "registerItem",
      accounts: [
        { name: "vault", isMut: true, isSigner: false },
        { name: "item", isMut: true, isSigner: false },
        { name: "nftMint", isMut: false, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "itemId", type: "string" },
        { name: "name", type: "string" },
        { name: "condition", type: "u8" },
        { name: "appraisedValueUsdCents", type: "u64" },
        { name: "category", type: "string" },
      ],
    },
    {
      name: "redeemItem",
      accounts: [
        { name: "item", isMut: true, isSigner: false },
        { name: "nftTokenAccount", isMut: false, isSigner: false },
        { name: "owner", isMut: false, isSigner: true },
      ],
      args: [
        { name: "itemId", type: "string" },
        { name: "shippingAddress", type: "string" },
      ],
    },
  ],
  accounts: [
    {
      name: "Vault",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "itemCount", type: "u64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "ItemRecord",
      type: {
        kind: "struct",
        fields: [
          { name: "vault", type: "publicKey" },
          { name: "itemId", type: "string" },
          { name: "name", type: "string" },
          { name: "nftMint", type: "publicKey" },
          { name: "condition", type: "u8" },
          { name: "appraisedValueUsdCents", type: "u64" },
          { name: "status", type: "u8" },
          { name: "mintedAt", type: "i64" },
          { name: "redeemedAt", type: "i64" },
          { name: "shippingAddress", type: "string" },
          { name: "category", type: "string" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  events: [
    {
      name: "ItemRegistered",
      fields: [
        { name: "itemId", type: "string", index: false },
        { name: "nftMint", type: "publicKey", index: false },
        { name: "name", type: "string", index: false },
        { name: "appraisedValueUsdCents", type: "u64", index: false },
        { name: "mintedAt", type: "i64", index: false },
      ],
    },
    {
      name: "ItemRedeemed",
      fields: [
        { name: "itemId", type: "string", index: false },
        { name: "nftMint", type: "publicKey", index: false },
        { name: "redeemedBy", type: "publicKey", index: false },
        { name: "shippingAddress", type: "string", index: false },
        { name: "redeemedAt", type: "i64", index: false },
      ],
    },
  ],
  errors: [
    { code: 6000, name: "ItemIdTooLong", msg: "Item ID must be 32 characters or less" },
    { code: 6001, name: "NameTooLong", msg: "Name must be 64 characters or less" },
    { code: 6002, name: "InvalidCondition", msg: "Condition must be 0-5" },
    { code: 6003, name: "AddressTooLong", msg: "Shipping address must be 200 characters or less" },
    { code: 6004, name: "NotInVault", msg: "Item is not currently in the vault" },
    { code: 6005, name: "NotNftOwner", msg: "You do not own this NFT" },
    { code: 6006, name: "WrongNft", msg: "NFT does not match this item record" },
    { code: 6007, name: "CategoryTooLong", msg: "Category must be 32 characters or less" },
  ],
} as const;
