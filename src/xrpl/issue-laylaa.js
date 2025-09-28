// Issue LAYLAA Tokens on XRPL Testnet
// This script sets up the issuer account and issues LAYLAA tokens to holder accounts
require('dotenv').config();
const xrpl = require('xrpl');
const LAYLAAIssuer = require('./laylaa-iou');

async function issueLAYLAATokens() {
    console.log('🚀 Starting LAYLAA token issuance process...\n');

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
        
        console.log(`🏦 Issuer: ${issuerWallet.address}`);
        console.log(`👤 Holder: ${holderWallet.address}\n`);

        // Initialize LAYLAA issuer
        const laylaaIssuer = new LAYLAAIssuer(issuerWallet);
        await laylaaIssuer.connect();

        // Step 1: Setup issuer account with proper flags
        console.log('📋 Step 1: Setting up issuer account...');
        const issuerSetup = await laylaaIssuer.setupIssuerAccount();
        console.log(`✅ Issuer setup complete: ${issuerSetup.transactionHash}\n`);

        // Step 2: Create trust line from holder to issuer
        console.log('📋 Step 2: Creating trust line for holder...');
        const trustLineResult = await laylaaIssuer.createTrustLine(holderWallet, '1000000');
        console.log(`✅ Trust line created: ${trustLineResult.transactionHash}\n`);

        // Step 3: Issue LAYLAA tokens to holder
        const initialSupply = 10000; // Issue 10,000 LAYLAA tokens
        console.log(`📋 Step 3: Issuing ${initialSupply} LAYLAA tokens...`);
        const issuanceResult = await laylaaIssuer.issueTokens(holderAddress, initialSupply);
        console.log(`✅ Tokens issued: ${issuanceResult.transactionHash}\n`);

        // Step 4: Verify token balance
        console.log('📋 Step 4: Verifying token balance...');
        const balance = await laylaaIssuer.getTokenBalance(holderAddress);
        console.log(`💰 Holder balance: ${balance.balance} LAYLAA\n`);

        // Display issuer information
        const issuerInfo = await laylaaIssuer.getIssuerInfo();
        
        console.log('🎉 LAYLAA token issuance completed successfully!\n');
        console.log('📋 Summary:');
        console.log(`   • Currency: ${issuerInfo.currency}`);
        console.log(`   • Issuer: ${issuerInfo.address}`);
        console.log(`   • Initial Supply: ${initialSupply} LAYLAA`);
        console.log(`   • Holder Balance: ${balance.balance} LAYLAA\n`);
        
        console.log('🔗 Explorer Links:');
        console.log(`   • Issuer Setup: https://testnet.xrpl.org/transactions/${issuerSetup.transactionHash}`);
        console.log(`   • Trust Line: https://testnet.xrpl.org/transactions/${trustLineResult.transactionHash}`);
        console.log(`   • Token Issuance: https://testnet.xrpl.org/transactions/${issuanceResult.transactionHash}`);
        console.log(`   • Issuer Account: ${issuerInfo.explorerUrl}`);
        console.log(`   • Holder Account: https://testnet.xrpl.org/accounts/${holderAddress}\n`);
        
        console.log('⚡ Next Steps:');
        console.log('   • Run: npm run balance (to check current balances)');
        console.log('   • Run: npm run burn (to test token burning for Midnight NFT)\n');

        await laylaaIssuer.disconnect();

    } catch (error) {
        console.error('❌ Error during token issuance:', error);
        process.exit(1);
    }
}

// Run the issuance if this script is executed directly
if (require.main === module) {
    issueLAYLAATokens().catch(console.error);
}

module.exports = { issueLAYLAATokens };