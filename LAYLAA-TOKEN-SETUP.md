# 🌙 LAYLAA IOU Token Setup Guide

## Overview
This guide covers the complete setup for the LAYLAA IOU token on XRPL Testnet, which serves as the burn-to-mint mechanism for the Midnight blockchain NFT system.

## 🏗️ Architecture Summary

### LAYLAA Token Flow
```
1. Issue LAYLAA (IOU) → 2. Hold Tokens → 3. Burn Tokens → 4. Capture TX Hash → 5. Mint Midnight NFT
```

### Key Components Built
- ✅ **LAYLAA IOU Token Module** (`src/xrpl/laylaa-iou.js`)
- ✅ **Wallet Generation** (`src/xrpl/setup-wallets.js`)
- ✅ **Token Issuance** (`src/xrpl/issue-laylaa.js`)
- ✅ **Token Burning** (`src/xrpl/burn-laylaa.js`)
- ✅ **Balance Checking** (`src/xrpl/check-balance.js`)
- ✅ **Package Configuration** (updated `package.json`)
- ✅ **Environment Template** (`.env.example`)

## 🚀 Quick Start

### Prerequisites
1. Install Node.js (v18+) from https://nodejs.org/
2. Install Yarn: `npm install -g yarn`

### Setup Steps
```bash
# 1. Install dependencies
yarn install

# 2. Generate testnet wallets (creates .env file)
yarn setup

# 3. Set up issuer and issue initial LAYLAA tokens
yarn issue

# 4. Check balances
yarn balance

# 5. Burn tokens for Midnight NFT (captures transaction hash)
yarn burn --amount 100
```

## 📋 File Structure

```
src/xrpl/
├── laylaa-iou.js          # Core IOU token management
├── setup-wallets.js       # Generate & fund testnet wallets
├── issue-laylaa.js        # Issue LAYLAA tokens to holders
├── burn-laylaa.js         # Burn tokens & generate ZKP proof
├── check-balance.js       # Check LAYLAA token balances
├── token.js              # Original NFT-based approach (legacy)
├── burn.js               # Original NFT burn logic (legacy)
└── lace-wallet-integration.js  # Browser wallet integration
```

## 🔥 Burn Process Details

### What Happens When You Burn
1. **Validation**: Check holder has sufficient LAYLAA balance
2. **Burn Transaction**: Send LAYLAA tokens back to issuer (Payment)
3. **Hash Capture**: Record transaction hash for ZKP verification
4. **Media Selection**: Deterministically select 1 of 25 media files
5. **Proof Generation**: Create burn proof structure for Midnight
6. **File Output**: Save proof to `burn-proofs/burn-proof-{hash}.json`

### Burn Proof Output
```json
{
  "xrplTxHash": "ABC123...",
  "burnAmount": 100,
  "burnerAddress": "rXXX...",
  "mediaId": 15,
  "proofHash": "DEF456...",
  "midnightContract": {
    "expectedInputs": {
      "xrplTxHash": "ABC123...",
      "burnAmount": 100,
      "recipient": "MIDNIGHT_WALLET_ADDRESS_HERE"
    }
  }
}
```

## 🌐 XRPL Testnet Integration

### Explorer Links
- **Testnet Explorer**: https://testnet.xrpl.org/
- **Account Pages**: `https://testnet.xrpl.org/accounts/{address}`
- **Transaction Pages**: `https://testnet.xrpl.org/transactions/{hash}`

### Wallet Information
After running `yarn setup`, check:
- `.env` file for wallet credentials
- `wallets.json` for detailed wallet info with explorer links
- Console output for direct explorer URLs

## 🔗 Midnight Integration

### ZKP Circuit Inputs
The Midnight `burnToMintLaylaaNFT` circuit expects:
- `xrplTxHash: Bytes<64>` - XRPL burn transaction hash
- `burnAmount: Uint<64>` - Amount of LAYLAA burned
- `recipient: ZswapCoinPublicKey` - Midnight wallet for NFT

### Media Selection
- **Deterministic**: Based on transaction hash
- **Range**: 1-25 (matching 25 media files)
- **Algorithm**: `(parseInt(txHash.slice(-8), 16) % 25) + 1`

## 🛠️ Troubleshooting

### Common Issues
1. **"Missing wallet credentials"**: Run `yarn setup` first
2. **"Insufficient balance"**: Run `yarn issue` to get LAYLAA tokens
3. **"Trust line not found"**: Issue process creates trust line automatically
4. **Node.js not found**: Install Node.js from nodejs.org

### Verification Steps
```bash
# Check if wallets exist
ls -la .env wallets.json

# Verify XRPL connection
yarn balance

# Test small burn
yarn burn --amount 1
```

## 📊 Token Economics

### Initial Configuration
- **Currency**: LAYLAA (6 decimals)
- **Initial Supply**: 10,000 LAYLAA per holder
- **Trust Limit**: 1,000,000 LAYLAA
- **Burn Amount**: Configurable (default 100 LAYLAA)

### Cost Structure
- **Wallet Funding**: ~1,000 XRP per wallet (testnet)
- **Transaction Fees**: ~0.00001 XRP per transaction
- **Trust Line**: ~2 XRP reserve (returned when closed)

## 🎯 Next Steps

### For Development
1. Install Node.js and run the setup commands
2. Test the complete flow: setup → issue → burn
3. Verify burn proofs are generated correctly
4. Integrate transaction hashes with Midnight contract

### For Production
1. Switch to XRPL Mainnet endpoints
2. Use real XRP for wallet funding
3. Implement proper key management
4. Add error handling and retry logic
5. Set up monitoring and alerting

## 🔐 Security Notes

### Testnet Safety
- Uses XRPL Testnet (no real value)
- Wallets auto-generated with test XRP
- Safe to experiment and test

### Production Considerations
- Store wallet secrets securely (never in code)
- Use hardware wallets for issuer accounts
- Implement multi-signature for large issuances
- Monitor for unusual burn patterns

---

**Built for the Midnight Hackathon - LAYLAA IOU Token Infrastructure**

*Ready for integration with Midnight ZKP circuits for cross-chain NFT minting*
