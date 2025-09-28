// Multi-LAYLAA Token System - 25 Unique Assets on XRPL Testnet
// This module handles 25 different LAYLAA tokens (LY1-LY25) for multi-format asset support
const xrpl = require('xrpl');
const crypto = require('crypto');

class MultiLAYLAAIssuer {
    constructor(issuerWallet, testnetClient = null) {
        this.issuerWallet = issuerWallet;
        this.client = testnetClient || new xrpl.Client('wss://s.altnet.rippletest.net:51233');
        this.decimals = 6;
        
        // Generate 25 unique currency codes using 3-letter combinations
        this.currencies = [
            'LYA', 'LYB', 'LYC', 'LYD', 'LYE', 'LYF', 'LYG', 'LYH', 'LYI', 'LYJ',
            'LYK', 'LYL', 'LYM', 'LYN', 'LYO', 'LYP', 'LYQ', 'LYR', 'LYS', 'LYT',
            'LYU', 'LYV', 'LYW', 'LYX', 'LYZ'
        ];
        
        // Media format mapping for each token (LYA-LYZ)
        this.mediaFormats = {
            'LYA': 'image/jpeg', 'LYB': 'image/png', 'LYC': 'video/mp4', 'LYD': 'image/gif', 'LYE': 'video/webm',
            'LYF': 'image/svg', 'LYG': 'audio/mp3', 'LYH': 'image/webp', 'LYI': 'video/mov', 'LYJ': 'image/tiff',
            'LYK': 'video/avi', 'LYL': 'image/bmp', 'LYM': 'audio/wav', 'LYN': 'image/heic', 'LYO': 'video/mkv',
            'LYP': 'image/raw', 'LYQ': 'audio/flac', 'LYR': 'image/eps', 'LYS': 'video/wmv', 'LYT': 'image/ico',
            'LYU': 'audio/aac', 'LYV': 'image/psd', 'LYW': 'video/flv', 'LYX': 'image/ai', 'LYZ': 'video/3gp'
        };
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

    // Setup issuer account for all 25 tokens
    async setupIssuerAccount() {
        try {
            await this.connect();
            
            console.log(`🏦 Setting up multi-token issuer: ${this.issuerWallet.address}`);
            console.log(`🎯 Will issue 25 unique LAYLAA tokens: ${this.currencies.join(', ')}`);
            
            // Set DefaultRipple flag for token issuance
            const accountSetTx = {
                TransactionType: 'AccountSet',
                Account: this.issuerWallet.address,
                SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
                Memos: [{
                    Memo: {
                        MemoData: xrpl.convertStringToHex('Multi-LAYLAA Token Issuer - 25 Assets'),
                        MemoType: xrpl.convertStringToHex('multi_token_setup')
                    }
                }]
            };

            const prepared = await this.client.autofill(accountSetTx);
            const signed = this.issuerWallet.sign(prepared);
            const result = await this.client.submitAndWait(signed.tx_blob);

            if (result.result.meta.TransactionResult === 'tesSUCCESS') {
                console.log('✅ Multi-token issuer configured successfully');
                console.log(`📋 Transaction: ${result.result.hash}`);
                return {
                    success: true,
                    transactionHash: result.result.hash,
                    issuerAddress: this.issuerWallet.address,
                    supportedTokens: this.currencies
                };
            } else {
                throw new Error(`Multi-token setup failed: ${result.result.meta.TransactionResult}`);
            }
        } catch (error) {
            console.error('❌ Error setting up multi-token issuer:', error);
            throw error;
        }
    }

    // Create trust lines for all 25 tokens
    async createAllTrustLines(holderWallet, trustLimit = '100000') {
        try {
            await this.connect();
            
            console.log(`🤝 Creating trust lines for all 25 LAYLAA tokens...`);
            console.log(`👤 Holder: ${holderWallet.address}`);
            
            const trustLineResults = [];
            
            for (let i = 0; i < this.currencies.length; i++) {
                const currency = this.currencies[i];
                const mediaFormat = this.mediaFormats[currency];
                
                console.log(`📋 ${i + 1}/25: Creating trust line for ${currency} (${mediaFormat})`);
                
                const trustSetTx = {
                    TransactionType: 'TrustSet',
                    Account: holderWallet.address,
                    LimitAmount: {
                        currency: currency,
                        issuer: this.issuerWallet.address,
                        value: trustLimit
                    },
                    Memos: [{
                        Memo: {
                            MemoData: xrpl.convertStringToHex(`LAYLAA ${currency} Trust - ${mediaFormat}`),
                            MemoType: xrpl.convertStringToHex('multi_trust_line'),
                            MemoFormat: xrpl.convertStringToHex(mediaFormat)
                        }
                    }]
                };

                const prepared = await this.client.autofill(trustSetTx);
                const signed = holderWallet.sign(prepared);
                const result = await this.client.submitAndWait(signed.tx_blob);

                if (result.result.meta.TransactionResult === 'tesSUCCESS') {
                    console.log(`✅ ${currency} trust line created: ${result.result.hash}`);
                    trustLineResults.push({
                        currency: currency,
                        mediaFormat: mediaFormat,
                        transactionHash: result.result.hash,
                        success: true
                    });
                } else {
                    console.log(`❌ ${currency} trust line failed: ${result.result.meta.TransactionResult}`);
                    trustLineResults.push({
                        currency: currency,
                        mediaFormat: mediaFormat,
                        error: result.result.meta.TransactionResult,
                        success: false
                    });
                }
                
                // Small delay between transactions to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const successCount = trustLineResults.filter(r => r.success).length;
            console.log(`\\n🎉 Trust line creation completed: ${successCount}/25 successful`);
            
            return {
                success: successCount === 25,
                results: trustLineResults,
                successCount: successCount,
                totalTokens: 25
            };
            
        } catch (error) {
            console.error('❌ Error creating trust lines:', error);
            throw error;
        }
    }

    // Issue all 25 LAYLAA tokens
    async issueAllTokens(holderAddress, amountPerToken = 1000) {
        try {
            await this.connect();
            
            console.log(`💰 Issuing ${amountPerToken} tokens for each of 25 LAYLAA assets...`);
            console.log(`🎯 Total tokens to be issued: ${25 * amountPerToken}`);
            
            const issuanceResults = [];
            
            for (let i = 0; i < this.currencies.length; i++) {
                const currency = this.currencies[i];
                const mediaFormat = this.mediaFormats[currency];
                
                console.log(`📋 ${i + 1}/25: Issuing ${amountPerToken} ${currency} tokens (${mediaFormat})`);
                
                const issueTx = {
                    TransactionType: 'Payment',
                    Account: this.issuerWallet.address,
                    Destination: holderAddress,
                    Amount: {
                        currency: currency,
                        value: amountPerToken.toString(),
                        issuer: this.issuerWallet.address
                    },
                    Memos: [{
                        Memo: {
                            MemoData: xrpl.convertStringToHex(`LAYLAA ${currency} Issuance - ${mediaFormat} Asset`),
                            MemoType: xrpl.convertStringToHex('multi_token_issuance'),
                            MemoFormat: xrpl.convertStringToHex(mediaFormat)
                        }
                    }]
                };

                const prepared = await this.client.autofill(issueTx);
                const signed = this.issuerWallet.sign(prepared);
                const result = await this.client.submitAndWait(signed.tx_blob);

                if (result.result.meta.TransactionResult === 'tesSUCCESS') {
                    console.log(`✅ ${currency} tokens issued: ${result.result.hash}`);
                    issuanceResults.push({
                        currency: currency,
                        mediaFormat: mediaFormat,
                        amount: amountPerToken,
                        transactionHash: result.result.hash,
                        success: true
                    });
                } else {
                    console.log(`❌ ${currency} issuance failed: ${result.result.meta.TransactionResult}`);
                    issuanceResults.push({
                        currency: currency,
                        mediaFormat: mediaFormat,
                        amount: 0,
                        error: result.result.meta.TransactionResult,
                        success: false
                    });
                }
                
                // Small delay between transactions
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const successCount = issuanceResults.filter(r => r.success).length;
            const totalIssued = issuanceResults.filter(r => r.success).reduce((sum, r) => sum + r.amount, 0);
            
            console.log(`\\n🎉 Token issuance completed: ${successCount}/25 tokens issued`);
            console.log(`💎 Total LAYLAA tokens in circulation: ${totalIssued}`);
            
            return {
                success: successCount === 25,
                results: issuanceResults,
                successCount: successCount,
                totalTokens: 25,
                totalIssued: totalIssued
            };
            
        } catch (error) {
            console.error('❌ Error issuing tokens:', error);
            throw error;
        }
    }

    // Get balances for all 25 tokens
    async getAllTokenBalances(accountAddress) {
        try {
            await this.connect();
            
            const accountLines = await this.client.request({
                command: 'account_lines',
                account: accountAddress
            });

            const balances = {};
            let totalBalance = 0;
            
            this.currencies.forEach(currency => {
                const line = accountLines.result.lines.find(line => 
                    line.currency === currency && line.account === this.issuerWallet.address
                );
                
                const balance = line ? parseFloat(line.balance) : 0;
                balances[currency] = {
                    balance: balance,
                    mediaFormat: this.mediaFormats[currency],
                    limit: line ? line.limit : '0'
                };
                totalBalance += balance;
            });

            return {
                balances: balances,
                totalBalance: totalBalance,
                tokenCount: Object.keys(balances).length,
                issuer: this.issuerWallet.address
            };
            
        } catch (error) {
            console.error('❌ Error getting token balances:', error);
            throw error;
        }
    }

    // Burn specific LAYLAA token and generate proof
    async burnToken(holderWallet, currency, amount) {
        try {
            if (!this.currencies.includes(currency)) {
                throw new Error(`Invalid currency: ${currency}. Must be one of: ${this.currencies.join(', ')}`);
            }
            
            await this.connect();
            
            const mediaFormat = this.mediaFormats[currency];
            const mediaId = this.currencies.indexOf(currency) + 1; // 1-25
            
            console.log(`🔥 Burning ${amount} ${currency} tokens (Media ID: ${mediaId}, Format: ${mediaFormat})`);
            
            const burnTx = {
                TransactionType: 'Payment',
                Account: holderWallet.address,
                Destination: this.issuerWallet.address,
                Amount: {
                    currency: currency,
                    value: amount.toString(),
                    issuer: this.issuerWallet.address
                },
                Memos: [{
                    Memo: {
                        MemoData: xrpl.convertStringToHex(`LAYLAA ${currency} Burn - Media ID ${mediaId} for Midnight NFT`),
                        MemoType: xrpl.convertStringToHex('multi_token_burn'),
                        MemoFormat: xrpl.convertStringToHex(mediaFormat)
                    }
                }]
            };

            const prepared = await this.client.autofill(burnTx);
            const signed = holderWallet.sign(prepared);
            const txHash = signed.hash;
            const result = await this.client.submitAndWait(signed.tx_blob);

            if (result.result.meta.TransactionResult === 'tesSUCCESS') {
                console.log(`✅ Successfully burned ${amount} ${currency} tokens`);
                console.log(`📋 Transaction Hash: ${txHash}`);
                console.log(`🔗 Explorer: https://testnet.xrpl.org/transactions/${txHash}`);
                
                // Generate burn proof for Midnight ZKP verification
                const burnProof = await this.generateBurnProof(txHash, currency, amount, mediaId, mediaFormat, holderWallet.address, result);
                
                return {
                    success: true,
                    transactionHash: txHash,
                    currency: currency,
                    amount: amount,
                    mediaId: mediaId,
                    mediaFormat: mediaFormat,
                    burnerAddress: holderWallet.address,
                    ledgerIndex: result.result.ledger_index,
                    burnProof: burnProof,
                    explorerUrl: `https://testnet.xrpl.org/transactions/${txHash}`
                };
            } else {
                throw new Error(`Token burn failed: ${result.result.meta.TransactionResult}`);
            }
        } catch (error) {
            console.error('❌ Error burning token:', error);
            throw error;
        }
    }

    // Generate burn proof for Midnight ZKP circuit
    async generateBurnProof(txHash, currency, amount, mediaId, mediaFormat, burnerAddress, burnResult) {
        try {
            console.log('🔍 Generating multi-token burn proof for Midnight ZKP verification...');
            
            const txDetails = await this.client.request({
                command: 'tx',
                transaction: txHash
            });

            const ledgerInfo = await this.client.request({
                command: 'ledger',
                ledger_index: burnResult.result.ledger_index
            });

            const burnProof = {
                // Core burn information for ZKP circuit
                xrplTxHash: txHash,
                burnAmount: amount,
                burnerAddress: burnerAddress,
                currency: currency,
                issuer: this.issuerWallet.address,
                
                // Media asset information
                mediaId: mediaId,
                mediaFormat: mediaFormat,
                assetType: this.getAssetType(mediaFormat),
                
                // Blockchain verification data
                ledgerIndex: burnResult.result.ledger_index,
                ledgerHash: ledgerInfo.result.ledger_hash,
                timestamp: Math.floor(Date.now() / 1000),
                
                // Multi-token system info
                tokenSystem: {
                    totalTokenTypes: 25,
                    supportedFormats: Object.values(this.mediaFormats),
                    burnedTokenIndex: mediaId
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

            // Create proof hash for uniqueness
            burnProof.proofHash = this.createProofHash(burnProof);

            console.log(`✅ Multi-token burn proof generated`);
            console.log(`🎯 Media ID: ${mediaId}/25 (${mediaFormat})`);
            console.log(`🔒 Proof Hash: ${burnProof.proofHash}`);
            
            return burnProof;
        } catch (error) {
            console.error('❌ Error generating burn proof:', error);
            throw error;
        }
    }

    // Get asset type from media format
    getAssetType(mediaFormat) {
        if (mediaFormat.startsWith('image/')) return 'image';
        if (mediaFormat.startsWith('video/')) return 'video';
        if (mediaFormat.startsWith('audio/')) return 'audio';
        return 'other';
    }

    // Create cryptographic hash of burn proof
    createProofHash(burnProof) {
        const proofString = JSON.stringify({
            xrplTxHash: burnProof.xrplTxHash,
            burnAmount: burnProof.burnAmount,
            currency: burnProof.currency,
            mediaId: burnProof.mediaId,
            burnerAddress: burnProof.burnerAddress,
            ledgerIndex: burnProof.ledgerIndex,
            timestamp: burnProof.timestamp
        });

        return crypto.createHash('sha256').update(proofString).digest('hex');
    }

    // Get issuer information
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
                supportedTokens: this.currencies,
                mediaFormats: this.mediaFormats,
                explorerUrl: `https://testnet.xrpl.org/accounts/${this.issuerWallet.address}`
            };
        } catch (error) {
            console.error('❌ Error getting issuer info:', error);
            throw error;
        }
    }
}

module.exports = MultiLAYLAAIssuer;
