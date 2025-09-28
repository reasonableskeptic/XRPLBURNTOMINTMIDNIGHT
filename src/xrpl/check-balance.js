// Check LAYLAA Token Balances on XRPL Testnet
// This script displays current LAYLAA token balances and account information
require('dotenv').config();
const xrpl = require('xrpl');
const LAYLAAIssuer = require('./laylaa-iou');

async function checkBalances() {
    console.log('💰 Checking LAYLAA token balances on XRPL Testnet...\n');

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

        // Initialize LAYLAA issuer
        const laylaaIssuer = new LAYLAAIssuer(issuerWallet);
        await laylaaIssuer.connect();

        // Get issuer information
        console.log('🏦 Issuer Account Information:');
        const issuerInfo = await laylaaIssuer.getIssuerInfo();
        console.log(`   • Address: ${issuerInfo.address}`);
        console.log(`   • XRP Balance: ${xrpl.dropsToXrp(issuerInfo.balance)} XRP`);
        console.log(`   • Sequence: ${issuerInfo.sequence}`);
        console.log(`   • Currency: ${issuerInfo.currency}`);
        console.log(`   • Explorer: ${issuerInfo.explorerUrl}\n`);

        // Get holder LAYLAA balance
        console.log('👤 Holder Account Information:');
        const holderBalance = await laylaaIssuer.getTokenBalance(holderWallet.address);
        
        // Get holder XRP balance
        const holderAccountInfo = await laylaaIssuer.client.request({
            command: 'account_info',
            account: holderWallet.address
        });
        
        console.log(`   • Address: ${holderWallet.address}`);
        console.log(`   • XRP Balance: ${xrpl.dropsToXrp(holderAccountInfo.result.account_data.Balance)} XRP`);
        console.log(`   • LAYLAA Balance: ${holderBalance.balance} LAYLAA`);
        console.log(`   • Trust Limit: ${holderBalance.limit} LAYLAA`);
        console.log(`   • Explorer: https://testnet.xrpl.org/accounts/${holderWallet.address}\n`);

        // Get account lines for detailed trust line information
        console.log('🔗 Trust Line Details:');
        const accountLines = await laylaaIssuer.client.request({
            command: 'account_lines',
            account: holderWallet.address
        });

        const laylaaLine = accountLines.result.lines.find(line => 
            line.currency === 'LAYLAA' && line.account === issuerWallet.address
        );

        if (laylaaLine) {
            console.log(`   • Currency: ${laylaaLine.currency}`);
            console.log(`   • Balance: ${laylaaLine.balance} LAYLAA`);
            console.log(`   • Limit: ${laylaaLine.limit} LAYLAA`);
            console.log(`   • Quality In: ${laylaaLine.quality_in || 'N/A'}`);
            console.log(`   • Quality Out: ${laylaaLine.quality_out || 'N/A'}`);
        } else {
            console.log('   • No LAYLAA trust line found');
        }

        // Check for recent transactions
        console.log('\n📋 Recent Account Activity:');
        try {
            const holderTxHistory = await laylaaIssuer.client.request({
                command: 'account_tx',
                account: holderWallet.address,
                limit: 5
            });

            if (holderTxHistory.result.transactions.length > 0) {
                holderTxHistory.result.transactions.forEach((tx, index) => {
                    const txData = tx.tx;
                    const meta = tx.meta;
                    console.log(`   ${index + 1}. ${txData.TransactionType} - ${txData.hash}`);
                    console.log(`      • Result: ${meta.TransactionResult}`);
                    console.log(`      • Ledger: ${tx.tx.ledger_index || 'N/A'}`);
                    if (txData.Amount && typeof txData.Amount === 'object') {
                        console.log(`      • Amount: ${txData.Amount.value} ${txData.Amount.currency}`);
                    }
                });
            } else {
                console.log('   • No recent transactions found');
            }
        } catch (error) {
            console.log('   • Could not fetch transaction history');
        }

        console.log('\n🎯 Summary:');
        console.log(`   • Total LAYLAA in circulation: ${holderBalance.balance}`);
        console.log(`   • Available for burning: ${holderBalance.balance} LAYLAA`);
        console.log(`   • Ready for Midnight NFT minting: ${holderBalance.balance > 0 ? 'Yes' : 'No'}\n`);

        if (holderBalance.balance > 0) {
            console.log('⚡ Available Actions:');
            console.log(`   • Burn tokens: npm run burn --amount ${Math.min(100, holderBalance.balance)}`);
            console.log('   • Check explorer for real-time updates');
        } else {
            console.log('⚡ Next Steps:');
            console.log('   • Issue more tokens: npm run issue');
            console.log('   • Check issuer account setup');
        }

        await laylaaIssuer.disconnect();

    } catch (error) {
        console.error('❌ Error checking balances:', error);
        process.exit(1);
    }
}

// Run the balance check if this script is executed directly
if (require.main === module) {
    checkBalances().catch(console.error);
}

module.exports = { checkBalances };