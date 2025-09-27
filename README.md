# 🌙 LAYLAA NFT on Midnight
## Cross-Chain Burn-to-Mint NFT System with Zero-Knowledge Proofs

![Midnight](https://img.shields.io/badge/Midnight-Blockchain-purple)
![XRPL](https://img.shields.io/badge/XRPL-Testnet-blue)
![Compact](https://img.shields.io/badge/Compact-Smart%20Contract-green)
![ZKP](https://img.shields.io/badge/ZKP-Circuits-orange)

---

## 🎯 **Project Overview**

**LAYLAA NFT** is an innovative cross-chain burn-to-mint system that bridges XRPL and Midnight blockchain using Zero-Knowledge Proofs. Users burn LAYLAA tokens on XRPL testnet to mint unique NFTs on Midnight, with each NFT featuring one of 25 carefully curated media assets (images, videos, and animations).

### **Key Innovation**
- **Zero-Knowledge Verification** - No oracles required; uses Midnight's native ZKP capabilities
- **Deterministic Media Selection** - Transaction hash-based selection ensures fairness
- **Multi-Media Support** - Images, GIFs, and videos in a single collection
- **Production Architecture** - Built on proven Midnight-Kitties framework

---

## 🏗️ **Technical Architecture**

### **Smart Contract (Compact Language)**
```compact
// Core NFT Structure
struct LaylaaNFT {
  mediaId: Uint<32>,           // References 1-25 media files
  xrplTxHash: Bytes<64>,       // XRPL burn transaction hash
  burnAmount: Uint<64>,        // Amount of LAYLAA tokens burned
  owner: ZswapCoinPublicKey,   // NFT owner on Midnight
  mintedAt: Uint<64>           // Minting timestamp
}

// Main burn-to-mint circuit
export circuit burnToMintLaylaaNFT(
  xrplTxHash: Bytes<64>,
  burnAmount: Uint<64>, 
  recipient: ZswapCoinPublicKey
): Uint<64>
```

### **ZKP Circuits Generated**
- **`burnToMintLaylaaNFT`** (440 rows) - Core burn-to-mint logic with double-spend protection
- **`getLaylaaNFT`** (149 rows) - Query NFT metadata and media references
- **Standard NFT Functions** - `approve`, `balanceOf`, `getApproved` (ERC-721 compatible)

---

## 🚀 **Compilation Results**

### **Successful ZKP Circuit Generation**
```bash
✅ circuit "burnToMintLaylaaNFT" (k=10, rows=440)
✅ circuit "getLaylaaNFT" (k=10, rows=149)  
✅ circuit "approve" (k=10, rows=408)
✅ circuit "balanceOf" (k=10, rows=188)
✅ circuit "getApproved" (k=10, rows=87)
```

---

## 🎨 **LAYLAA Media Collection**

### **25 Unique Assets**
- **20 Static Images** - JPG, JPEG, PNG formats
- **1 Animated GIF** - Dynamic visual content  
- **4 Video Files** - MP4 and MOV formats
- **Total Size** - ~300MB of high-quality media

### **Deterministic Selection**
Each XRPL burn transaction hash deterministically selects one of 25 media files, ensuring fairness while maintaining unpredictability.

---

## 🔧 **Technical Implementation**

### **Burn-to-Mint Workflow**
1. **User burns LAYLAA tokens** on XRPL testnet
2. **Transaction hash captured** for verification
3. **ZKP circuit verifies burn** without external oracles
4. **Media ID generated** deterministically from hash
5. **NFT minted** on Midnight with selected media
6. **Double-spend protection** prevents re-use of burn transactions

### **Key Features**
- ✅ **Zero-Knowledge Verification** - No trusted third parties
- ✅ **Double-Spend Protection** - Each XRPL burn can only mint once
- ✅ **Deterministic Fairness** - Media selection based on transaction hash
- ✅ **Multi-Media Support** - Images, animations, and videos
- ✅ **Production Ready** - Built on proven Midnight architecture

---

## 🛠️ **Development Setup**

### **Build Commands**
```bash
# Compile Compact smart contracts to ZKP circuits
yarn compact

# Build all TypeScript packages  
yarn build

# Build contracts only
yarn build:contracts
```

---

## 🎯 **Midnight Hackathon Submission**

### **What We Built**
- **Complete Smart Contract** - 151 lines of production-ready Compact code
- **ZKP Circuit Compilation** - Successfully generated 5 zero-knowledge proof circuits
- **Cross-Chain Integration** - XRPL burn verification with Midnight NFT minting
- **Media Collection** - 25 unique LAYLAA assets with multi-format support
- **Professional Architecture** - Monorepo structure following Midnight best practices

### **Technical Achievements**
- **Zero External Dependencies** - Pure Midnight ZKP verification (no oracles)
- **Deterministic Randomness** - Fair media selection using transaction hashes
- **Production Scalability** - Built on proven midnight-contracts framework
- **Type Safety** - Full TypeScript integration with generated contract bindings

### **Innovation Highlights**
- **First Multi-Media NFT Collection** on Midnight with video support
- **Cross-Chain ZKP Verification** without trusted third parties  
- **Deterministic Asset Selection** ensuring fairness and verifiability
- **Enterprise Architecture** ready for production deployment

---

## 📊 **Project Metrics**

| Metric | Value |
|-----------|-------|
| **Smart Contract Lines** | 151 |
| **ZKP Circuits Generated** | 5 |
| **Media Assets** | 25 files |
| **Supported Formats** | 8 (JPG, PNG, GIF, MP4, etc.) |
| **Build Time** | ~4 seconds |
| **Circuit Complexity** | k=10, max 440 rows |

---

## 👥 **Team**

**Stephanie Mellott** - *Project Lead & Smart Contract Developer*
- LAYLAA NFT concept and implementation
- Compact smart contract development
- Cross-chain architecture design

---

## 🔗 **Links**

- **GitHub Repository**: https://github.com/Island-Ghost/XRPLBURNTOMINTMIDNIGHT
- **Midnight Network**: https://midnight.network
- **XRPL Documentation**: https://xrpl.org

---

*Built for the Midnight Hackathon - Showcasing the power of Zero-Knowledge Proofs in cross-chain NFT innovation.*