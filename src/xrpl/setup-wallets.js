// Setup XRPL Testnet Wallets for LAYLAA Token
// This script generates issuer and holder wallets and funds them with testnet XRP
const xrpl = require('xrpl');
const fs = require('fs');
const path = require('path');

async function setupWallets() {
    console.log('🚀 Setting up XRPL Testnet wallets for LAYLAA token...\n');
    
    // Connect to testnet
    const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
    await client.connect();
    console.log('✅ Connected to XRPL Testnet\n');

    try {
        // Generate issuer wallet
        console.log('🏦 Generating LAYLAA token issuer wallet...');
        const issuerWallet = xrpl.Wallet.generate();
        console.log(`📍 Issuer Address: ${issuerWallet.address}`);
        console.log(`🔑 Issuer Secret: ${issuerWallet.seed}`);
        
        // Fund issuer wallet with testnet XRP
        console.log('💰 Funding issuer wallet with testnet XRP...');
        const issuerFundResult = await client.fundWallet(issuerWallet);
        console.log(`✅ Issuer funded with ${xrpl.dropsToXrp(issuerFundResult.balance)} XRP\n`);

        // Generate holder wallet
        console.log('👤 Generating token holder wallet...');
        const holderWallet = xrpl.Wallet.generate();
        console.log(`📍 Holder Address: ${holderWallet.address}`);
        console.log(`🔑 Holder Secret: ${holderWallet.seed}`);
        
        // Fund holder wallet with testnet XRP
        console.log('💰 Funding holder wallet with testnet XRP...');
        const holderFundResult = await client.fundWallet(holderWallet);
        console.log(`✅ Holder funded with ${xrpl.dropsToXrp(holderFundResult.balance)} XRP\n`);

        // Create .env file with wallet credentials
        const envContent = `# XRPL Testnet Wallets for LAYLAA Token
# Generated on ${new Date().toISOString()}

# LAYLAA Token Issuer Wallet
ISSUER_ADDRESS=${issuerWallet.address}
ISSUER_SECRET=${issuerWallet.seed}

# Token Holder Wallet (for testing)
HOLDER_ADDRESS=${holderWallet.address}
HOLDER_SECRET=${holderWallet.seed}

# XRPL Testnet Configuration
XRPL_TESTNET_URL=wss://s.altnet.rippletest.net:51233
CURRENCY_CODE=LAY
DECIMALS=6
`;

        const envPath = path.join(process.cwd(), '.env');
        fs.writeFileSync(envPath, envContent);
        console.log(`📄 Wallet credentials saved to .env file\n`);

        // Create wallets.json for easy reference
        const walletsData = {
            issuer: {
                address: issuerWallet.address,
                secret: issuerWallet.seed,
                balance: xrpl.dropsToXrp(issuerFundResult.balance),
                explorerUrl: `https://testnet.xrpl.org/accounts/${issuerWallet.address}`
            },
            holder: {
                address: holderWallet.address,
                secret: holderWallet.seed,
                balance: xrpl.dropsToXrp(holderFundResult.balance),
                explorerUrl: `https://testnet.xrpl.org/accounts/${holderWallet.address}`
            },
            network: 'testnet',
            currency: 'LAY',
            decimals: 6,
            generatedAt: new Date().toISOString()
        };

        const walletsPath = path.join(process.cwd(), 'wallets.json');
        fs.writeFileSync(walletsPath, JSON.stringify(walletsData, null, 2));
        console.log(`📄 Wallet details saved to wallets.json\n`);

        // Display summary
        console.log('🎉 Wallet setup completed successfully!\n');
        console.log('📋 Summary:');
        console.log(`   • Issuer: ${issuerWallet.address}`);
        console.log(`   • Holder: ${holderWallet.address}`);
        console.log(`   • Network: XRPL Testnet`);
        console.log(`   • Currency: LAY (6 decimals)\n`);
        
        console.log('🔗 Explorer Links:');
        console.log(`   • Issuer: https://testnet.xrpl.org/accounts/${issuerWallet.address}`);
        console.log(`   • Holder: https://testnet.xrpl.org/accounts/${holderWallet.address}\n`);
        
        console.log('⚡ Next Steps:');
        console.log('   1. Run: npm run issue (to set up issuer and issue tokens)');
        console.log('   2. Run: npm run balance (to check token balances)');
        console.log('   3. Run: npm run burn (to test token burning)\n');

    } catch (error) {
        console.error('❌ Error setting up wallets:', error);
        process.exit(1);
    } finally {
        await client.disconnect();
        console.log('✅ Disconnected from XRPL Testnet');
    }
}

// Run the setup if this script is executed directly
if (require.main === module) {
    setupWallets().catch(console.error);
}

module.exports = { setupWallets };