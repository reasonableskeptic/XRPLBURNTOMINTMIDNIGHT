// Issue All 25 LAYLAA Tokens on XRPL Testnet
// This script creates 25 unique LAYLAA tokens (LY1-LY25) with multi-format support
require('dotenv').config();
const xrpl = require('xrpl');
const MultiLAYLAAIssuer = require('./multi-laylaa-issuer');
const fs = require('fs');
const path = require('path');

async function issueAll25LAYLAATokens() {
    console.log('🚀 Starting 25 LAYLAA token issuance process...\n');
    console.log('🎯 Creating multi-format asset collection for Midnight NFT system\n');

    // Load wallet credentials from environment
    const issuerSecret = process.env.ISSUER_SECRET;
    const holderAddress = process.env.HOLDER_ADDRESS;
    const holderSecret = process.env.HOLDER_SECRET;

    if (!issuerSecret || !holderAddress || !holderSecret) {
        console.error('❌ Missing wallet credentials in .env file');
        console.log('💡 Run: npm run setup (to generate wallets first)');
        process.exit(1);
    }

    try {
        // Create wallets from secrets
        const issuerWallet = xrpl.Wallet.fromSeed(issuerSecret);
        const holderWallet = xrpl.Wallet.fromSeed(holderSecret);
        
        console.log(`🏦 Multi-Token Issuer: ${issuerWallet.address}`);
        console.log(`👤 Token Holder: ${holderWallet.address}\n`);

        // Initialize Multi-LAYLAA issuer
        const multiIssuer = new MultiLAYLAAIssuer(issuerWallet);
        await multiIssuer.connect();

        // Step 1: Setup multi-token issuer account
        console.log('📋 Step 1: Setting up multi-token issuer account...');
        const issuerSetup = await multiIssuer.setupIssuerAccount();
        console.log(`✅ Multi-token issuer setup complete: ${issuerSetup.transactionHash}`);
        console.log(`🎯 Supported tokens: ${issuerSetup.supportedTokens.join(', ')}\n`);

        // Step 2: Create trust lines for all 25 tokens
        console.log('📋 Step 2: Creating trust lines for all 25 LAYLAA tokens...');
        console.log('⏳ This may take a few minutes (1 second delay between transactions)\n');
        
        const trustLineResults = await multiIssuer.createAllTrustLines(holderWallet, '100000');
        
        if (trustLineResults.success) {
            console.log(`✅ All trust lines created successfully: ${trustLineResults.successCount}/25\n`);
        } else {
            console.log(`⚠️  Partial success: ${trustLineResults.successCount}/25 trust lines created\n`);
        }

        // Step 3: Issue tokens for all 25 assets
        const tokensPerAsset = 1000; // 1000 tokens per asset type
        console.log(`📋 Step 3: Issuing ${tokensPerAsset} tokens for each of 25 assets...`);
        console.log('⏳ This may take a few minutes (1 second delay between transactions)\n');
        
        const issuanceResults = await multiIssuer.issueAllTokens(holderAddress, tokensPerAsset);
        
        if (issuanceResults.success) {
            console.log(`✅ All tokens issued successfully: ${issuanceResults.totalIssued} total tokens\n`);
        } else {
            console.log(`⚠️  Partial success: ${issuanceResults.successCount}/25 token types issued\n`);
        }

        // Step 4: Verify all token balances
        console.log('📋 Step 4: Verifying all token balances...');
        const balances = await multiIssuer.getAllTokenBalances(holderAddress);
        
        console.log(`💰 Total LAYLAA tokens held: ${balances.totalBalance}`);
        console.log(`🎯 Token types in wallet: ${balances.tokenCount}/25\n`);

        // Display detailed results
        console.log('📊 Token Breakdown:');
        Object.entries(balances.balances).forEach(([currency, info]) => {
            const assetType = multiIssuer.getAssetType(info.mediaFormat);
            console.log(`   ${currency}: ${info.balance} tokens (${info.mediaFormat} - ${assetType})`);
        });

        // Save comprehensive results
        const resultsPath = path.join(process.cwd(), 'multi-token-results');
        if (!fs.existsSync(resultsPath)) {
            fs.mkdirSync(resultsPath);
        }

        const resultsData = {
            issuerSetup: issuerSetup,
            trustLineResults: trustLineResults,
            issuanceResults: issuanceResults,
            finalBalances: balances,
            summary: {
                totalTokenTypes: 25,
                totalTokensIssued: issuanceResults.totalIssued,
                successfulTrustLines: trustLineResults.successCount,
                successfulIssuances: issuanceResults.successCount,
                issuerAddress: issuerWallet.address,
                holderAddress: holderAddress
            },
            mediaFormats: multiIssuer.mediaFormats,
            generatedAt: new Date().toISOString()
        };

        const resultsFile = path.join(resultsPath, 'all-tokens-results.json');
        fs.writeFileSync(resultsFile, JSON.stringify(resultsData, null, 2));
        console.log(`\n📄 Complete results saved: ${resultsFile}`);

        // Display issuer information
        const issuerInfo = await multiIssuer.getIssuerInfo();
        
        console.log('\n🎉 25 LAYLAA token system deployment completed!\n');
        console.log('📋 Final Summary:');
        console.log(`   • Total Token Types: 25 (LY1-LY25)`);
        console.log(`   • Total Tokens Issued: ${issuanceResults.totalIssued}`);
        console.log(`   • Successful Trust Lines: ${trustLineResults.successCount}/25`);
        console.log(`   • Successful Issuances: ${issuanceResults.successCount}/25`);
        console.log(`   • Multi-Format Support: ✅ (images, videos, audio)`);
        console.log(`   • Issuer: ${issuerInfo.address}`);
        console.log(`   • Holder Balance: ${balances.totalBalance} total tokens\n`);
        
        console.log('🔗 Explorer Links:');
        console.log(`   • Issuer Setup: https://testnet.xrpl.org/transactions/${issuerSetup.transactionHash}`);
        console.log(`   • Issuer Account: ${issuerInfo.explorerUrl}`);
        console.log(`   • Holder Account: https://testnet.xrpl.org/accounts/${holderAddress}\n`);
        
        console.log('⚡ Next Steps:');
        console.log('   • Run: npm run balance-all (to check all token balances)');
        console.log('   • Run: npm run burn-multi --token LY1 --amount 100 (to test burning specific tokens)');
        console.log('   • Each burn will generate unique media ID (1-25) for Midnight NFT\n');

        await multiIssuer.disconnect();

        return resultsData;

    } catch (error) {
        console.error('❌ Error during multi-token issuance:', error);
        process.exit(1);
    }
}

// Run the multi-token issuance if this script is executed directly
if (require.main === module) {
    issueAll25LAYLAATokens().catch(console.error);
}

module.exports = { issueAll25LAYLAATokens };
