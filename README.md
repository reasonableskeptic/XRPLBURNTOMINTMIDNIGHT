# Laylaa NFT on Midnight - Burn-to-Mint System

## Project Overview
This project demonstrates a burn-to-mint system where LAYLAA tokens on XRPL testnet are burned to mint NFTs on the Midnight network for the Midnight Hackathon.

### Flow
1. **LAYLAA Token**: LAYLAA token exists on XRPL testnet
2. **Burn Process**: User burns LAYLAA tokens using XRPL app inside LACE wallet
3. **Proof Generation**: Burn generates cryptographic proof of completion
4. **ZKP Verification**: Midnight Compact smart contract verifies the burn proof using zero-knowledge proofs
5. **NFT Minting**: Midnight NFT is minted upon successful burn verification
6. **Ownership**: User receives the NFT on Midnight network

## Project Structure
```
Laylaa NFT on Midnight/
├── package.json                 # Node.js project configuration
├── README.md                    # This file
├── laylaa_nft.cmp              # Midnight Compact smart contract
├── src/
│   ├── xrpl/
│   │   ├── token.js                    # XRPL LAYLAA token logic
│   │   ├── burn.js                     # XRPL token burning logic
│   │   ├── verification.js             # Burn verification logic
│   │   └── lace-wallet-integration.js  # LACE wallet XRPL app integration
│   ├── midnight/
│   │   ├── contract.js         # Midnight contract interaction
│   │   └── nft.js              # NFT minting logic
│   ├── dapp/
│   │   ├── index.html          # DApp frontend
│   │   ├── app.js              # DApp main logic
│   │   └── styles.css          # DApp styling
│   └── zkp/
│       ├── proof-generation.js # ZKP proof generation
│       └── verification.js     # ZKP verification logic
└── tests/
    ├── xrpl.test.js            # XRPL functionality tests
    ├── midnight.test.js        # Midnight functionality tests
    └── burn-to-mint.test.js    # Burn-to-mint integration tests
```

## Smart Contract Features
- **ZKP Burn Verification**: Uses zero-knowledge proofs to verify LAYLAA token burns on XRPL testnet
- **NFT Minting**: Mints unique NFTs on Midnight for verified burns
- **Double-Spend Protection**: Prevents multiple NFT mints from the same burn transaction
- **LACE Wallet Integration**: Works with XRPL app inside LACE wallet
- **Compact Circuits**: Uses Midnight's Compact compiler for ZKP generation

## Development Commands
```bash
# Compile Compact contract
compact compile laylaa_nft.cmp

# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev
```

## Hackathon Demo Flow
1. Deploy LAYLAA token on XRPL testnet
2. Set up Compact contract on Midnight testnet
3. Connect LACE wallet with XRPL app
4. Demo burn-to-mint flow: burn LAYLAA → generate ZKP → mint NFT
5. Show NFT ownership on Midnight explorer

## Technologies Used
- **XRPL Testnet**: XRP Ledger testnet for LAYLAA token creation and burning
- **Midnight**: Compact smart contracts with ZKP circuits for NFT logic
- **LACE Wallet**: XRPL app integration for token burning
- **Zero-Knowledge Proofs**: Cryptographic verification of burns
- **Node.js**: Backend and DApp development
