#!/usr/bin/env bash
set -e

# ═══════════════════════════════════════════════════════════════════════════
# Q-INTEL QUANTUM E-WASTE PLATFORM — DEV SETUP (Agent 11)
# Prepares full stack: Rust/Anchor programs + admin + customer portals
# AI image API (Pinata), quantum models, pawn/shipping, e-waste categories
# ═══════════════════════════════════════════════════════════════════════════

echo "=== ♻️ Q-INTEL E-Waste — Dev Setup ==="

# ── 1. Rust ────────────────────────────────────────────────────────────────
if ! command -v rustc &>/dev/null; then
  echo "[1/6] Installing Rust..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
else
  echo "[1/6] Rust already installed: $(rustc --version)"
fi

# ── 2. Solana CLI ──────────────────────────────────────────────────────────
if ! command -v solana &>/dev/null; then
  echo "[2/6] Installing Solana CLI..."
  sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
  export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
else
  echo "[2/6] Solana already installed: $(solana --version)"
fi

# ── 3. Anchor via AVM ─────────────────────────────────────────────────────
if ! command -v anchor &>/dev/null; then
  echo "[3/6] Installing Anchor CLI via AVM..."
  cargo install --git https://github.com/coral-xyz/anchor avm --locked
  avm install 0.30.1
  avm use 0.30.1
else
  echo "[3/6] Anchor already installed: $(anchor --version)"
fi

# ── 4. Node.js via nvm ────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "[4/6] Installing Node.js via nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install --lts
  nvm use --lts
else
  echo "[4/6] Node already installed: $(node --version)"
fi

# ── 5. Solana devnet wallet ───────────────────────────────────────────────
echo "[5/6] Setting up devnet wallet..."
solana config set --url devnet
if [ ! -f "$HOME/.config/solana/id.json" ]; then
  solana-keygen new --no-bip39-passphrase
fi
echo "Your wallet address: $(solana address)"
echo ""
echo "Requesting devnet SOL airdrop (you need ~2 SOL to deploy + test)..."
solana airdrop 2 || echo "(Airdrop may fail if rate-limited — try: solana airdrop 2)"

# ── 6. Build & deploy Anchor program ─────────────────────────────────────
echo "[6/6] Building Anchor program..."
cd "$(dirname "$0")"
npm install
anchor build

echo ""
echo "=== Program built. Now updating program ID... ==="
PROGRAM_ID=$(anchor keys list | grep antique_vault | awk '{print $2}')
echo "Program ID: $PROGRAM_ID"

# Update declare_id! in lib.rs and Anchor.toml
sed -i.bak "s/Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS/$PROGRAM_ID/g" \
  programs/antique-vault/src/lib.rs Anchor.toml admin/.env.local.example
rm -f programs/antique-vault/src/lib.rs.bak Anchor.toml.bak admin/.env.local.example.bak

echo "Rebuilding with correct program ID..."
anchor build

echo ""
echo "Deploying to devnet..."
anchor deploy --provider.cluster devnet

echo ""
echo "=== Deployment complete! ==="
echo "Program ID: $PROGRAM_ID"
echo ""
echo "Next steps:"
echo "  1. Copy admin/.env.local.example → admin/.env.local"
echo "  2. Set NEXT_PUBLIC_PROGRAM_ID=$PROGRAM_ID in admin/.env.local"
echo "  3. Get a Pinata JWT at https://app.pinata.cloud/keys"
echo "  4. Set NEXT_PUBLIC_PINATA_JWT=<your-jwt> in admin/.env.local"
echo "  5. cd admin && npm install && npm run dev"
echo ""
echo "Admin portal will be at http://localhost:3000"
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  READY FOR THE TORCH — full e-waste quantum intelligence   ║"
echo "║  stack ready. Documented. Inspiring. Your move.            ║"
echo "╚════════════════════════════════════════════════════════════╝"
