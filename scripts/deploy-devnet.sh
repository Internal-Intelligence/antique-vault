#!/usr/bin/env bash
set -euo pipefail

# Requires Agave 4.x+ (solana-cargo-build-sbf with platform-tools v1.53+)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building programs..."
cargo-build-sbf --manifest-path programs/nftbay/Cargo.toml
cargo-build-sbf --manifest-path programs/antique-vault/Cargo.toml
cargo-build-sbf --manifest-path programs/acquisition-units/Cargo.toml

BALANCE=$(solana balance 2>/dev/null | awk '{print $1}')
echo "==> Wallet balance: ${BALANCE} SOL"
if awk "BEGIN {exit !($BALANCE < 2)}"; then
  echo "==> Requesting devnet airdrop (2 SOL)..."
  solana airdrop 2 || solana airdrop 1 || {
    echo "Airdrop failed (rate limit). Fund ~/.config/solana/id.json on devnet and re-run."
    exit 1
  }
fi

deploy_one() {
  local name="$1"
  local so="target/deploy/${name}.so"
  local kp="target/deploy/${name}-keypair.json"
  echo "==> Deploying ${name}..."
  solana program deploy "$so" --program-id "$kp" --max-sign-attempts 20
}

deploy_one nftbay
deploy_one antique_vault
deploy_one acquisition_units

echo "==> Done. Program IDs (Anchor.toml):"
echo "  nftbay:            7owcQnhZuqspQ2nUrQGSLqKiBZVpxvFDj4ngSWkHebqj"
echo "  antique_vault:     FnYhRhWkpALRFhm59FSmUeEaCRLvtQCXV2PVL5Hiz3WL"
echo "  acquisition_units: BLtdqGyjYZ7H5WjqVG2EtvY4TGxVpAqd8gBE4ZvydVHg"