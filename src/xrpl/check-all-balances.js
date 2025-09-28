// Check All 25 LAYLAA Token Balances on XRPL Testnet
// This script displays balances for all LY1-LY25 tokens with media format information
require('dotenv').config();
const xrpl = require('xrpl');
const MultiLAYLAAIssuer = require('./multi-laylaa-issuer');

async function checkAll25Balances() {
    console.log('💰 Checking all 25 LAYLAA token balances on XRPL Testnet...\n');

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

        // Get issuer information
        console.log('🏦 Multi-Token Issuer Information:');
        const issuerInfo = await multiIssuer.getIssuerInfo();
        console.log(`   • Address: ${issuerInfo.address}`);
        console.log(`   • XRP Balance: ${xrpl.dropsToXrp(issuerInfo.balance)} XRP`);
        console.log(`   • Supported Tokens: ${issuerInfo.supportedTokens.length} types`);
        console.log(`   • Explorer: ${issuerInfo.explorerUrl}\n`);

        // Get holder XRP balance
        const holderAccountInfo = await multiIssuer.client.request({
            command: 'account_info',
            account: holderWallet.address
        });
        
        console.log('👤 Token Holder Information:');
        console.log(`   • Address: ${holderWallet.address}`);
        console.log(`   • XRP Balance: ${xrpl.dropsToXrp(holderAccountInfo.result.account_data.Balance)} XRP`);
        console.log(`   • Explorer: https://testnet.xrpl.org/accounts/${holderWallet.address}\n`);

        // Get all LAYLAA token balances
        console.log('🎯 All LAYLAA Token Balances:');
        const allBalances = await multiIssuer.getAllTokenBalances(holderWallet.address);
        
        // Group by asset type for better display
        const assetTypes = {
            image: [],
            video: [],
            audio: [],
            other: []
        };

        Object.entries(allBalances.balances).forEach(([currency, info]) => {
            const assetType = multiIssuer.getAssetType(info.mediaFormat);
            assetTypes[assetType].push({
                currency,
                balance: info.balance,
                mediaFormat: info.mediaFormat,
                limit: info.limit
            });
        });

        // Display by category
        console.log('\n📸 Image Assets:');
        assetTypes.image.forEach(token => {
            console.log(`   ${token.currency}: ${token.balance} tokens (${token.mediaFormat})`);
        });

        console.log('\n🎬 Video Assets:');
        assetTypes.video.forEach(token => {
            console.log(`   ${token.currency}: ${token.balance} tokens (${token.mediaFormat})`);
        });

        console.log('\n🎵 Audio Assets:');
        assetTypes.audio.forEach(token => {
            console.log(`   ${token.currency}: ${token.balance} tokens (${token.mediaFormat})`);
        });

        if (assetTypes.other.length > 0) {
            console.log('\n📄 Other Assets:');
            assetTypes.other.forEach(token => {
                console.log(`   ${token.currency}: ${token.balance} tokens (${token.mediaFormat})`);
            });
        }

        // Summary statistics
        console.log('\n📊 Portfolio Summary:');
        console.log(`   • Total Token Types: ${allBalances.tokenCount}/25`);
        console.log(`   • Total Tokens Held: ${allBalances.totalBalance}`);
        console.log(`   • Image Assets: ${assetTypes.image.length} types`);
        console.log(`   • Video Assets: ${assetTypes.video.length} types`);
        console.log(`   • Audio Assets: ${assetTypes.audio.length} types`);
        
        const totalImageTokens = assetTypes.image.reduce((sum, t) => sum + t.balance, 0);
        const totalVideoTokens = assetTypes.video.reduce((sum, t) => sum + t.balance, 0);
        const totalAudioTokens = assetTypes.audio.reduce((sum, t) => sum + t.balance, 0);
        
        console.log(`   • Image Tokens: ${totalImageTokens}`);
        console.log(`   • Video Tokens: ${totalVideoTokens}`);
        console.log(`   • Audio Tokens: ${totalAudioTokens}\n`);

        // Check for recent transactions
        console.log('📋 Recent Multi-Token Activity:');
        try {
            const holderTxHistory = await multiIssuer.client.request({
                command: 'account_tx',
                account: holderWallet.address,
                limit: 10
            });

            if (holderTxHistory.result.transactions.length > 0) {
                let tokenTxCount = 0;
                holderTxHistory.result.transactions.forEach((tx, index) => {
                    const txData = tx.tx;
                    const meta = tx.meta;
                    
                    // Check if this is a token transaction
                    if (txData.Amount && typeof txData.Amount === 'object' && 
                        txData.Amount.currency && txData.Amount.currency.startsWith('LY')) {
                        tokenTxCount++;
                        console.log(`   ${tokenTxCount}. ${txData.TransactionType} - ${txData.hash}`);
                        console.log(`      • Token: ${txData.Amount.value} ${txData.Amount.currency}`);
                        console.log(`      • Result: ${meta.TransactionResult}`);
                        console.log(`      • Ledger: ${tx.tx.ledger_index || 'N/A'}`);
                    }
                });
                
                if (tokenTxCount === 0) {
                    console.log('   • No recent token transactions found');
                }
            } else {
                console.log('   • No recent transactions found');
            }
        } catch (error) {
            console.log('   • Could not fetch transaction history');
        }

        // Burn recommendations
        console.log('\n🔥 Available for Burning:');
        const burnableTokens = Object.entries(allBalances.balances)
            .filter(([currency, info]) => info.balance > 0)
            .slice(0, 5); // Show first 5 available

        if (burnableTokens.length > 0) {
            burnableTokens.forEach(([currency, info]) => {
                const mediaId = multiIssuer.currencies.indexOf(currency) + 1;
                console.log(`   • ${currency}: ${info.balance} available (Media ID: ${mediaId}, ${info.mediaFormat})`);
            });
            
            console.log('\n⚡ Burn Commands:');
            burnableTokens.forEach(([currency, info]) => {
                const burnAmount = Math.min(100, info.balance);
                console.log(`   npm run burn-multi --token ${currency} --amount ${burnAmount}`);
            });
        } else {
            console.log('   • No tokens available for burning');
            console.log('\n⚡ Next Steps:');
            console.log('   • Issue tokens first: npm run issue-all');
        }

        await multiIssuer.disconnect();

    } catch (error) {
        console.error('❌ Error checking balances:', error);
        process.exit(1);
    }
}

// Run the balance check if this script is executed directly
if (require.main === module) {
    checkAll25Balances().catch(console.error);
}

module.exports = { checkAll25Balances };
