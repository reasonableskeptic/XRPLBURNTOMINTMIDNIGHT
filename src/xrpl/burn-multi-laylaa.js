// Burn Specific LAYLAA Token for Midnight NFT Minting
// This script burns a specific LAYLAA token (LY1-LY25) and generates proof for Midnight ZKP
require('dotenv').config();
const xrpl = require('xrpl');
const MultiLAYLAAIssuer = require('./multi-laylaa-issuer');
const fs = require('fs');
const path = require('path');

async function burnMultiLAYLAAToken(tokenCurrency = 'LY1', burnAmount = 100) {
    console.log(`🔥 Starting ${tokenCurrency} token burn for Midnight NFT...\n`);

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
        
        // Initialize Multi-LAYLAA issuer
        const multiIssuer = new MultiLAYLAAIssuer(issuerWallet);
        await multiIssuer.connect();

        // Validate token currency
        if (!multiIssuer.currencies.includes(tokenCurrency)) {
            console.error(`❌ Invalid token currency: ${tokenCurrency}`);
            console.log(`💡 Valid currencies: ${multiIssuer.currencies.join(', ')}`);
            process.exit(1);
        }

        const mediaFormat = multiIssuer.mediaFormats[tokenCurrency];
        const mediaId = multiIssuer.currencies.indexOf(tokenCurrency) + 1;
        const assetType = multiIssuer.getAssetType(mediaFormat);
        
        console.log(`🏦 Issuer: ${issuerWallet.address}`);
        console.log(`👤 Holder: ${holderWallet.address}`);
        console.log(`🎯 Token: ${tokenCurrency} (Media ID: ${mediaId})`);
        console.log(`📄 Format: ${mediaFormat} (${assetType})`);
        console.log(`🔥 Burn Amount: ${burnAmount} tokens\n`);

        // Step 1: Check current balance before burning
        console.log('📋 Step 1: Checking current token balance...');
        const allBalances = await multiIssuer.getAllTokenBalances(holderWallet.address);
        const tokenBalance = allBalances.balances[tokenCurrency];
        
        if (!tokenBalance || tokenBalance.balance === 0) {
            console.error(`❌ No ${tokenCurrency} tokens found in wallet`);
            console.log('💡 Run: npm run issue-all (to issue all tokens first)');
            process.exit(1);
        }
        
        console.log(`💰 Current ${tokenCurrency} balance: ${tokenBalance.balance} tokens`);
        
        if (tokenBalance.balance < burnAmount) {
            console.error(`❌ Insufficient balance. Have: ${tokenBalance.balance}, Need: ${burnAmount}`);
            process.exit(1);
        }
        console.log('✅ Sufficient balance for burn\n');

        // Step 2: Burn the specific LAYLAA token
        console.log(`📋 Step 2: Burning ${burnAmount} ${tokenCurrency} tokens...`);
        const burnResult = await multiIssuer.burnToken(holderWallet, tokenCurrency, burnAmount);
        console.log(`✅ Burn successful: ${burnResult.transactionHash}\n`);

        // Step 3: Verify balance after burn
        console.log('📋 Step 3: Verifying balance after burn...');
        const balancesAfter = await multiIssuer.getAllTokenBalances(holderWallet.address);
        const newBalance = balancesAfter.balances[tokenCurrency];
        console.log(`💰 New ${tokenCurrency} balance: ${newBalance.balance} tokens`);
        console.log(`🔥 Burned: ${tokenBalance.balance - newBalance.balance} tokens\n`);

        // Step 4: Save burn proof for Midnight contract
        console.log('📋 Step 4: Saving burn proof for Midnight ZKP verification...');
        const burnProofPath = path.join(process.cwd(), 'burn-proofs');
        if (!fs.existsSync(burnProofPath)) {
            fs.mkdirSync(burnProofPath);
        }

        const proofFilename = `multi-burn-proof-${tokenCurrency}-${burnResult.transactionHash}.json`;
        const proofPath = path.join(burnProofPath, proofFilename);
        
        const burnProofData = {
            ...burnResult.burnProof,
            burnTransaction: {
                hash: burnResult.transactionHash,
                currency: tokenCurrency,
                amount: burnAmount,
                burnerAddress: holderWallet.address,
                ledgerIndex: burnResult.ledgerIndex,
                explorerUrl: burnResult.explorerUrl
            },
            assetInformation: {
                mediaId: mediaId,
                mediaFormat: mediaFormat,
                assetType: assetType,
                tokenIndex: `${mediaId}/25`,
                supportedFormats: Object.values(multiIssuer.mediaFormats)
            },
            midnightContract: {
                expectedInputs: {
                    xrplTxHash: burnResult.transactionHash, // 64 bytes hex
                    burnAmount: burnAmount, // Uint<64>
                    mediaId: mediaId, // 1-25 deterministic selection
                    recipient: "MIDNIGHT_WALLET_ADDRESS_HERE" // ZswapCoinPublicKey
                },
                assetMetadata: {
                    mediaFormat: mediaFormat,
                    assetType: assetType,
                    tokenCurrency: tokenCurrency
                },
                note: `Use xrplTxHash and burnAmount as inputs to burnToMintLaylaaNFT circuit. Media ID ${mediaId} will select ${mediaFormat} asset.`
            },
            generatedAt: new Date().toISOString()
        };

        fs.writeFileSync(proofPath, JSON.stringify(burnProofData, null, 2));
        console.log(`📄 Multi-token burn proof saved: ${proofPath}\n`);

        // Display comprehensive results
        console.log('🎉 Multi-LAYLAA token burn completed successfully!\n');
        console.log('📋 Burn Summary:');
        console.log(`   • Transaction Hash: ${burnResult.transactionHash}`);
        console.log(`   • Token Burned: ${tokenCurrency} (${burnAmount} tokens)`);
        console.log(`   • Media ID: ${mediaId}/25`);
        console.log(`   • Media Format: ${mediaFormat}`);
        console.log(`   • Asset Type: ${assetType}`);
        console.log(`   • Burner Address: ${holderWallet.address}`);
        console.log(`   • Ledger Index: ${burnResult.ledgerIndex}`);
        console.log(`   • Proof Hash: ${burnResult.burnProof.proofHash}\n`);
        
        console.log('🔗 Explorer Links:');
        console.log(`   • Burn Transaction: ${burnResult.explorerUrl}`);
        console.log(`   • Burner Account: https://testnet.xrpl.org/accounts/${holderWallet.address}\n`);
        
        console.log('🌙 Midnight Contract Integration:');
        console.log(`   • Circuit: burnToMintLaylaaNFT`);
        console.log(`   • Input xrplTxHash: ${burnResult.transactionHash}`);
        console.log(`   • Input burnAmount: ${burnAmount}`);
        console.log(`   • Input mediaId: ${mediaId}`);
        console.log(`   • Expected Asset: ${mediaFormat} (${assetType})`);
        console.log(`   • Proof File: ${proofPath}\n`);
        
        console.log('⚡ Next Steps for Midnight Integration:');
        console.log('   1. Use the transaction hash as input to Midnight ZKP circuit');
        console.log(`   2. Media ID ${mediaId} will deterministically select ${mediaFormat} asset`);
        console.log('   3. The circuit will verify the burn and mint NFT with the correct media');
        console.log('   4. Multi-format support ensures diverse NFT collection\n');

        // Show remaining balances
        console.log('💰 Remaining Token Balances:');
        const remainingTokens = Object.entries(balancesAfter.balances)
            .filter(([currency, info]) => info.balance > 0)
            .slice(0, 5);
            
        if (remainingTokens.length > 0) {
            remainingTokens.forEach(([currency, info]) => {
                const id = multiIssuer.currencies.indexOf(currency) + 1;
                console.log(`   ${currency}: ${info.balance} tokens (Media ID: ${id}, ${info.mediaFormat})`);
            });
        } else {
            console.log('   • No tokens remaining - issue more with: npm run issue-all');
        }

        await multiIssuer.disconnect();

        // Return burn result for programmatic use
        return burnResult;

    } catch (error) {
        console.error('❌ Error during multi-token burn:', error);
        process.exit(1);
    }
}

// Handle command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    let tokenCurrency = 'LYA'; // default to LYA instead of LY1
    let burnAmount = 100; // default

    // Handle both --token format and direct arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--token' && args[i + 1]) {
            tokenCurrency = args[i + 1].toUpperCase();
        } else if (args[i] === '--amount' && args[i + 1]) {
            burnAmount = parseFloat(args[i + 1]);
            if (isNaN(burnAmount) || burnAmount <= 0) {
                console.error('❌ Invalid burn amount. Must be a positive number.');
                process.exit(1);
            }
        } else if (i === 0 && !args[i].startsWith('--')) {
            // First argument without -- is token currency
            tokenCurrency = args[i].toUpperCase();
        } else if (i === 1 && !args[i].startsWith('--')) {
            // Second argument without -- is burn amount
            burnAmount = parseFloat(args[i]);
            if (isNaN(burnAmount) || burnAmount <= 0) {
                console.error('❌ Invalid burn amount. Must be a positive number.');
                process.exit(1);
            }
        }
    }

    return { tokenCurrency, burnAmount };
}

// Run the burn if this script is executed directly
if (require.main === module) {
    const { tokenCurrency, burnAmount } = parseArgs();
    console.log(`🎯 Burning ${burnAmount} ${tokenCurrency} tokens...\n`);
    burnMultiLAYLAAToken(tokenCurrency, burnAmount).catch(console.error);
}

module.exports = { burnMultiLAYLAAToken };
