// Burn LAYLAA Tokens for Midnight NFT Minting
// This script burns LAYLAA tokens and generates proof data for Midnight ZKP verification
require('dotenv').config();
const xrpl = require('xrpl');
const LAYLAAIssuer = require('./laylaa-iou');
const fs = require('fs');
const path = require('path');

async function burnLAYLAATokens(burnAmount = 100) {
    console.log('🔥 Starting LAYLAA token burn process for Midnight NFT...\n');

    // Load wallet credentials from environment
    const issuerSecret = process.env.ISSUER_SECRET;
    const holderSecret = process.env.HOLDER_SECRET;

    if (!issuerSecret || !holderSecret) {
        console.error('❌ Missing wallet credentials in .env file');
        console.log('💡 Run: npm run setup (to generate wallets first)');
        process.exit(1);
    }

    try {
        // Create wallets from secrets
        const issuerWallet = xrpl.Wallet.fromSeed(issuerSecret);
        const holderWallet = xrpl.Wallet.fromSeed(holderSecret);
        
        console.log(`🏦 Issuer: ${issuerWallet.address}`);
        console.log(`👤 Holder: ${holderWallet.address}`);
        console.log(`🔥 Burn Amount: ${burnAmount} LAYLAA\n`);

        // Initialize LAYLAA issuer
        const laylaaIssuer = new LAYLAAIssuer(issuerWallet);
        await laylaaIssuer.connect();

        // Step 1: Check current balance before burning
        console.log('📋 Step 1: Checking current LAYLAA balance...');
        const balanceBefore = await laylaaIssuer.getTokenBalance(holderWallet.address);
        console.log(`💰 Current balance: ${balanceBefore.balance} LAYLAA`);
        
        if (balanceBefore.balance < burnAmount) {
            throw new Error(`Insufficient balance. Have: ${balanceBefore.balance}, Need: ${burnAmount}`);
        }
        console.log('✅ Sufficient balance for burn\n');

        // Step 2: Burn LAYLAA tokens
        console.log(`📋 Step 2: Burning ${burnAmount} LAYLAA tokens...`);
        const burnResult = await laylaaIssuer.burnTokens(holderWallet, burnAmount);
        console.log(`✅ Burn successful: ${burnResult.transactionHash}\n`);

        // Step 3: Verify balance after burn
        console.log('📋 Step 3: Verifying balance after burn...');
        const balanceAfter = await laylaaIssuer.getTokenBalance(holderWallet.address);
        console.log(`💰 New balance: ${balanceAfter.balance} LAYLAA`);
        console.log(`🔥 Burned: ${balanceBefore.balance - balanceAfter.balance} LAYLAA\n`);

        // Step 4: Save burn proof for Midnight contract
        console.log('📋 Step 4: Saving burn proof for Midnight ZKP verification...');
        const burnProofPath = path.join(process.cwd(), 'burn-proofs');
        if (!fs.existsSync(burnProofPath)) {
            fs.mkdirSync(burnProofPath);
        }

        const proofFilename = `burn-proof-${burnResult.transactionHash}.json`;
        const proofPath = path.join(burnProofPath, proofFilename);
        
        const burnProofData = {
            ...burnResult.burnProof,
            burnTransaction: {
                hash: burnResult.transactionHash,
                amount: burnAmount,
                burnerAddress: holderWallet.address,
                ledgerIndex: burnResult.ledgerIndex,
                explorerUrl: burnResult.explorerUrl
            },
            midnightContract: {
                expectedInputs: {
                    xrplTxHash: burnResult.transactionHash, // 64 bytes hex
                    burnAmount: burnAmount, // Uint<64>
                    recipient: "MIDNIGHT_WALLET_ADDRESS_HERE" // ZswapCoinPublicKey
                },
                mediaId: burnResult.burnProof.mediaId,
                note: "Use xrplTxHash and burnAmount as inputs to burnToMintLaylaaNFT circuit"
            },
            generatedAt: new Date().toISOString()
        };

        fs.writeFileSync(proofPath, JSON.stringify(burnProofData, null, 2));
        console.log(`📄 Burn proof saved: ${proofPath}\n`);

        // Display comprehensive results
        console.log('🎉 LAYLAA token burn completed successfully!\n');
        console.log('📋 Burn Summary:');
        console.log(`   • Transaction Hash: ${burnResult.transactionHash}`);
        console.log(`   • Amount Burned: ${burnAmount} LAYLAA`);
        console.log(`   • Burner Address: ${holderWallet.address}`);
        console.log(`   • Ledger Index: ${burnResult.ledgerIndex}`);
        console.log(`   • Media ID: ${burnResult.burnProof.mediaId} (of 25)`);
        console.log(`   • Proof Hash: ${burnResult.burnProof.proofHash}\n`);
        
        console.log('🔗 Explorer Links:');
        console.log(`   • Burn Transaction: ${burnResult.explorerUrl}`);
        console.log(`   • Burner Account: https://testnet.xrpl.org/accounts/${holderWallet.address}\n`);
        
        console.log('🌙 Midnight Contract Integration:');
        console.log(`   • Circuit: burnToMintLaylaaNFT`);
        console.log(`   • Input xrplTxHash: ${burnResult.transactionHash}`);
        console.log(`   • Input burnAmount: ${burnAmount}`);
        console.log(`   • Expected Media ID: ${burnResult.burnProof.mediaId}`);
        console.log(`   • Proof File: ${proofPath}\n`);
        
        console.log('⚡ Next Steps for Midnight Integration:');
        console.log('   1. Use the transaction hash as input to Midnight ZKP circuit');
        console.log('   2. The circuit will verify the burn and mint NFT with media ID', burnResult.burnProof.mediaId);
        console.log('   3. Media file will be deterministically selected from 25 available assets\n');

        await laylaaIssuer.disconnect();

        // Return burn result for programmatic use
        return burnResult;

    } catch (error) {
        console.error('❌ Error during token burn:', error);
        process.exit(1);
    }
}

// Handle command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    let burnAmount = 100; // default

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--amount' && args[i + 1]) {
            burnAmount = parseFloat(args[i + 1]);
            if (isNaN(burnAmount) || burnAmount <= 0) {
                console.error('❌ Invalid burn amount. Must be a positive number.');
                process.exit(1);
            }
        }
    }

    return { burnAmount };
}

// Run the burn if this script is executed directly
if (require.main === module) {
    const { burnAmount } = parseArgs();
    console.log(`🎯 Burning ${burnAmount} LAYLAA tokens...\n`);
    burnLAYLAATokens(burnAmount).catch(console.error);
}

module.exports = { burnLAYLAATokens };