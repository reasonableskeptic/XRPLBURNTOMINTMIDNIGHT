// LAYLAA IOU Token Management on XRPL Testnet
// This module handles fungible LAYLAA token issuance, transfers, and burning
const xrpl = require('xrpl');
const crypto = require('crypto');

class LAYLAAIssuer {
    constructor(issuerWallet, testnetClient = null) {
        this.issuerWallet = issuerWallet;
        this.client = testnetClient || new xrpl.Client('wss://s.altnet.rippletest.net:51233');
        this.currency = 'LAY'; // XRPL requires 3-char currency codes
        this.decimals = 6; // 6 decimal places as specified in README
    }

    // Connect to XRPL Testnet
    async connect() {
        if (!this.client.isConnected()) {
            console.log('🔗 Connecting to XRPL Testnet...');
            await this.client.connect();
            console.log('✅ Connected to XRPL Testnet');
        }
    }

    // Disconnect from XRPL
    async disconnect() {
        if (this.client.isConnected()) {
            await this.client.disconnect();
            console.log('✅ Disconnected from XRPL Testnet');
        }
    }

    // Set up issuer account with proper flags for token issuance
    async setupIssuerAccount() {
        try {
            await this.connect();
            
            console.log(`🏦 Setting up issuer account: ${this.issuerWallet.address}`);
            
            // Set DefaultRipple flag to allow rippling (standard for token issuers)
            const accountSetTx = {
                TransactionType: 'AccountSet',
                Account: this.issuerWallet.address,
                SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
                Memos: [{
                    Memo: {
                        MemoData: xrpl.convertStringToHex('LAYLAA Token Issuer Setup'),
                        MemoType: xrpl.convertStringToHex('issuer_setup')
                    }
                }]
            };

            const prepared = await this.client.autofill(accountSetTx);
            const signed = this.issuerWallet.sign(prepared);
            const result = await this.client.submitAndWait(signed.tx_blob);

            if (result.result.meta.TransactionResult === 'tesSUCCESS') {
                console.log('✅ Issuer account configured successfully');
                console.log(`📋 Transaction: ${result.result.hash}`);
                return {
                    success: true,
                    transactionHash: result.result.hash,
                    issuerAddress: this.issuerWallet.address
                };
            } else {
                throw new Error(`Account setup failed: ${result.result.meta.TransactionResult}`);
            }
        } catch (error) {
            console.error('❌ Error setting up issuer account:', error);
            throw error;
        }
    }

    // Issue LAYLAA tokens to a holder account
    async issueTokens(holderAddress, amount) {
        try {
            await this.connect();
            
            console.log(`💰 Issuing ${amount} LAYLAA tokens to ${holderAddress}`);
            
            // Convert amount to string with proper decimal formatting
            const formattedAmount = amount.toString();
            
            // Create payment transaction to issue tokens
            const issueTx = {
                TransactionType: 'Payment',
                Account: this.issuerWallet.address,
                Destination: holderAddress,
                Amount: {
                    currency: this.currency,
                    value: formattedAmount,
                    issuer: this.issuerWallet.address
                },
                Memos: [{
                    Memo: {
                        MemoData: xrpl.convertStringToHex(`LAYLAA Token Issuance - ${amount} tokens`),
                        MemoType: xrpl.convertStringToHex('token_issuance')
                    }
                }]
            };

            const prepared = await this.client.autofill(issueTx);
            const signed = this.issuerWallet.sign(prepared);
            const result = await this.client.submitAndWait(signed.tx_blob);

            if (result.result.meta.TransactionResult === 'tesSUCCESS') {
                console.log(`✅ Successfully issued ${amount} LAYLAA tokens`);
                console.log(`📋 Transaction: ${result.result.hash}`);
                return {
                    success: true,
                    transactionHash: result.result.hash,
                    amount: amount,
                    recipient: holderAddress,
                    currency: this.currency,
                    issuer: this.issuerWallet.address
                };
            } else {
                throw new Error(`Token issuance failed: ${result.result.meta.TransactionResult}`);
            }
        } catch (error) {
            console.error('❌ Error issuing LAYLAA tokens:', error);
            throw error;
        }
    }

    // Get LAYLAA token balance for an account
    async getTokenBalance(accountAddress) {
        try {
            await this.connect();
            
            const accountLines = await this.client.request({
                command: 'account_lines',
                account: accountAddress
            });

            // Find LAYLAA token balance
            const laylaaBalance = accountLines.result.lines.find(line => 
                line.currency === this.currency && line.account === this.issuerWallet.address
            );

            if (laylaaBalance) {
                return {
                    balance: parseFloat(laylaaBalance.balance),
                    currency: this.currency,
                    issuer: this.issuerWallet.address,
                    limit: laylaaBalance.limit
                };
            } else {
                return {
                    balance: 0,
                    currency: this.currency,
                    issuer: this.issuerWallet.address,
                    limit: '0'
                };
            }
        } catch (error) {
            console.error('❌ Error getting token balance:', error);
            throw error;
        }
    }

    // Create trust line for LAYLAA token (holder must call this)
    async createTrustLine(holderWallet, trustLimit = '1000000') {
        try {
            await this.connect();
            
            console.log(`🤝 Creating trust line for ${holderWallet.address} to hold LAYLAA tokens`);
            
            const trustSetTx = {
                TransactionType: 'TrustSet',
                Account: holderWallet.address,
                LimitAmount: {
                    currency: this.currency,
                    issuer: this.issuerWallet.address,
                    value: trustLimit
                },
                Memos: [{
                    Memo: {
                        MemoData: xrpl.convertStringToHex(`LAYLAA Trust Line - Limit: ${trustLimit}`),
                        MemoType: xrpl.convertStringToHex('trust_line')
                    }
                }]
            };

            const prepared = await this.client.autofill(trustSetTx);
            const signed = holderWallet.sign(prepared);
            const result = await this.client.submitAndWait(signed.tx_blob);

            if (result.result.meta.TransactionResult === 'tesSUCCESS') {
                console.log('✅ Trust line created successfully');
                console.log(`📋 Transaction: ${result.result.hash}`);
                return {
                    success: true,
                    transactionHash: result.result.hash,
                    holderAddress: holderWallet.address,
                    trustLimit: trustLimit
                };
            } else {
                throw new Error(`Trust line creation failed: ${result.result.meta.TransactionResult}`);
            }
        } catch (error) {
            console.error('❌ Error creating trust line:', error);
            throw error;
        }
    }

    // Burn LAYLAA tokens by sending them back to issuer with zero value
    async burnTokens(holderWallet, amount) {
        try {
            await this.connect();
            
            console.log(`🔥 Burning ${amount} LAYLAA tokens from ${holderWallet.address}`);
            
            // Create payment back to issuer (this effectively burns the tokens)
            const burnTx = {
                TransactionType: 'Payment',
                Account: holderWallet.address,
                Destination: this.issuerWallet.address,
                Amount: {
                    currency: this.currency,
                    value: amount.toString(),
                    issuer: this.issuerWallet.address
                },
                Memos: [{
                    Memo: {
                        MemoData: xrpl.convertStringToHex(`LAYLAA Token Burn - ${amount} tokens for Midnight NFT`),
                        MemoType: xrpl.convertStringToHex('token_burn'),
                        MemoFormat: xrpl.convertStringToHex('burn_proof')
                    }
                }]
            };

            const prepared = await this.client.autofill(burnTx);
            const signed = holderWallet.sign(prepared);
            
            // Get transaction hash before submission for ZKP proof
            const txHash = signed.hash;
            
            const result = await this.client.submitAndWait(signed.tx_blob);

            if (result.result.meta.TransactionResult === 'tesSUCCESS') {
                console.log(`✅ Successfully burned ${amount} LAYLAA tokens`);
                console.log(`📋 Transaction Hash: ${txHash}`);
                console.log(`🔗 Explorer: https://testnet.xrpl.org/transactions/${txHash}`);
                
                // Generate burn proof for Midnight ZKP verification
                const burnProof = await this.generateBurnProof(txHash, amount, holderWallet.address, result);
                
                return {
                    success: true,
                    transactionHash: txHash,
                    amount: amount,
                    burnerAddress: holderWallet.address,
                    ledgerIndex: result.result.ledger_index,
                    burnProof: burnProof,
                    explorerUrl: `https://testnet.xrpl.org/transactions/${txHash}`
                };
            } else {
                throw new Error(`Token burn failed: ${result.result.meta.TransactionResult}`);
            }
        } catch (error) {
            console.error('❌ Error burning LAYLAA tokens:', error);
            throw error;
        }
    }

    // Generate burn proof for Midnight ZKP circuit verification
    async generateBurnProof(txHash, amount, burnerAddress, burnResult) {
        try {
            console.log('🔍 Generating burn proof for Midnight ZKP verification...');
            
            // Get transaction details
            const txDetails = await this.client.request({
                command: 'tx',
                transaction: txHash
            });

            // Get ledger information
            const ledgerInfo = await this.client.request({
                command: 'ledger',
                ledger_index: burnResult.result.ledger_index
            });

            // Create burn proof structure for Midnight contract
            const burnProof = {
                // Core burn information required by ZKP circuit
                xrplTxHash: txHash, // This is what Midnight contract expects
                burnAmount: amount,
                burnerAddress: burnerAddress,
                currency: this.currency,
                issuer: this.issuerWallet.address,
                
                // Blockchain verification data
                ledgerIndex: burnResult.result.ledger_index,
                ledgerHash: ledgerInfo.result.ledger_hash,
                timestamp: Math.floor(Date.now() / 1000),
                
                // Transaction verification details
                transactionDetails: {
                    account: txDetails.result.Account,
                    destination: txDetails.result.Destination,
                    fee: txDetails.result.Fee,
                    sequence: txDetails.result.Sequence,
                    memos: txDetails.result.Memos || []
                },
                
                // Proof components for ZKP verification
                proofComponents: {
                    transactionResult: burnResult.result.meta.TransactionResult,
                    validated: txDetails.result.validated,
                    ledgerProof: {
                        closeTime: ledgerInfo.result.close_time,
                        parentHash: ledgerInfo.result.parent_hash,
                        totalCoins: ledgerInfo.result.total_coins
                    }
                }
            };

            // Generate deterministic media ID (1-25) from transaction hash
            // This matches the logic described in README for media selection
            const mediaId = this.generateMediaId(txHash);
            burnProof.mediaId = mediaId;

            // Create proof hash for uniqueness and verification
            burnProof.proofHash = this.createProofHash(burnProof);

            console.log(`✅ Burn proof generated - Media ID: ${mediaId}`);
            console.log(`🎯 Proof Hash: ${burnProof.proofHash}`);
            
            return burnProof;
        } catch (error) {
            console.error('❌ Error generating burn proof:', error);
            throw error;
        }
    }

    // Generate deterministic media ID (1-25) from transaction hash
    generateMediaId(txHash) {
        // Use last 8 characters of transaction hash for deterministic selection
        const hashSuffix = txHash.slice(-8);
        const hashInt = parseInt(hashSuffix, 16);
        // Map to 1-25 range (25 media files as per README)
        return (hashInt % 25) + 1;
    }

    // Create cryptographic hash of burn proof for verification
    createProofHash(burnProof) {
        const proofString = JSON.stringify({
            xrplTxHash: burnProof.xrplTxHash,
            burnAmount: burnProof.burnAmount,
            burnerAddress: burnProof.burnerAddress,
            currency: burnProof.currency,
            issuer: burnProof.issuer,
            ledgerIndex: burnProof.ledgerIndex,
            timestamp: burnProof.timestamp
        });

        return crypto.createHash('sha256').update(proofString).digest('hex');
    }

    // Get issuer account information
    async getIssuerInfo() {
        try {
            await this.connect();
            
            const accountInfo = await this.client.request({
                command: 'account_info',
                account: this.issuerWallet.address
            });

            return {
                address: this.issuerWallet.address,
                balance: accountInfo.result.account_data.Balance,
                sequence: accountInfo.result.account_data.Sequence,
                flags: accountInfo.result.account_data.Flags,
                currency: this.currency,
                explorerUrl: `https://testnet.xrpl.org/accounts/${this.issuerWallet.address}`
            };
        } catch (error) {
            console.error('❌ Error getting issuer info:', error);
            throw error;
        }
    }
}

module.exports = LAYLAAIssuer;