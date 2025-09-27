// LACE Wallet Integration for XRPL LAYLAA Token
// This handles XRP wallet interactions within the LACE wallet X app environment

class LaceXRPLIntegration {
    constructor() {
        this.walletConnected = false;
        this.xrpWallet = null;
        this.laceAPI = null;
        this.tokenSymbol = 'LAYLAA';
    }

    // Initialize connection to LACE wallet
    async initializeLaceWallet() {
        try {
            console.log('🔗 Connecting to LACE wallet...');
            
            // Check if LACE wallet is available
            if (typeof window !== 'undefined' && window.lace) {
                this.laceAPI = window.lace;
                console.log('✅ LACE wallet detected');
                return true;
            } else {
                throw new Error('LACE wallet not found. Please install LACE wallet extension.');
            }
        } catch (error) {
            console.error('❌ Error initializing LACE wallet:', error);
            throw error;
        }
    }

    // Connect to XRP wallet within LACE
    async connectXRPWallet() {
        try {
            console.log('🔗 Connecting to XRP wallet in LACE...');
            
            // Request XRP wallet connection through LACE API
            const walletConnection = await this.laceAPI.xrp.connect({
                network: 'testnet', // or 'mainnet'
                permissions: ['read_account', 'sign_transactions']
            });

            if (walletConnection.success) {
                this.xrpWallet = {
                    address: walletConnection.address,
                    publicKey: walletConnection.publicKey,
                    network: walletConnection.network
                };
                this.walletConnected = true;
                
                console.log('✅ XRP wallet connected:', this.xrpWallet.address);
                return this.xrpWallet;
            } else {
                throw new Error('Failed to connect XRP wallet');
            }
        } catch (error) {
            console.error('❌ Error connecting XRP wallet:', error);
            throw error;
        }
    }

    // Get LAYLAA token balance from XRP wallet
    async getLAYLAABalance() {
        try {
            if (!this.walletConnected) {
                throw new Error('Wallet not connected');
            }

            console.log('💰 Getting LAYLAA token balance...');
            
            // Query LAYLAA tokens in the wallet
            const tokenBalance = await this.laceAPI.xrp.getTokenBalance({
                address: this.xrpWallet.address,
                tokenSymbol: this.tokenSymbol
            });

            console.log(`✅ LAYLAA Balance: ${tokenBalance.amount}`);
            return {
                symbol: this.tokenSymbol,
                amount: tokenBalance.amount,
                tokens: tokenBalance.tokens || []
            };
        } catch (error) {
            console.error('❌ Error getting LAYLAA balance:', error);
            throw error;
        }
    }

    // Create burn transaction for LAYLAA token
    async createBurnTransaction(tokenId, amount = 1) {
        try {
            if (!this.walletConnected) {
                throw new Error('Wallet not connected');
            }

            console.log(`🔥 Creating burn transaction for token: ${tokenId}`);
            
            // Prepare burn transaction
            const burnTx = {
                TransactionType: 'NFTokenBurn',
                Account: this.xrpWallet.address,
                NFTokenID: tokenId,
                Memos: [{
                    Memo: {
                        MemoData: this.convertStringToHex(`LAYLAA Burn for Midnight NFT - Amount: ${amount}`),
                        MemoType: this.convertStringToHex('burn_proof'),
                        MemoFormat: this.convertStringToHex('text/plain')
                    }
                }]
            };

            console.log('✅ Burn transaction prepared');
            return burnTx;
        } catch (error) {
            console.error('❌ Error creating burn transaction:', error);
            throw error;
        }
    }

    // Sign and submit burn transaction through LACE
    async signAndSubmitBurn(burnTransaction) {
        try {
            console.log('✍️ Signing burn transaction with LACE wallet...');
            
            // Request transaction signing through LACE
            const signedTx = await this.laceAPI.xrp.signTransaction({
                transaction: burnTransaction,
                wallet: this.xrpWallet.address
            });

            if (!signedTx.success) {
                throw new Error('Transaction signing failed');
            }

            console.log('📤 Submitting burn transaction...');
            
            // Submit signed transaction
            const submitResult = await this.laceAPI.xrp.submitTransaction({
                signedTransaction: signedTx.blob,
                transactionHash: signedTx.hash
            });

            if (submitResult.success) {
                console.log('✅ Burn transaction submitted:', submitResult.hash);
                return {
                    success: true,
                    transactionHash: submitResult.hash,
                    ledgerIndex: submitResult.ledgerIndex,
                    timestamp: Date.now()
                };
            } else {
                throw new Error(`Transaction submission failed: ${submitResult.error}`);
            }
        } catch (error) {
            console.error('❌ Error signing/submitting burn transaction:', error);
            throw error;
        }
    }

    // Complete burn process: create, sign, submit, and generate proof
    async burnLAYLAAToken(tokenId, amount = 1) {
        try {
            console.log(`🔥 Starting LAYLAA token burn process...`);
            
            // Step 1: Verify token ownership
            const ownsToken = await this.verifyTokenOwnership(tokenId);
            if (!ownsToken) {
                throw new Error('You do not own this LAYLAA token');
            }

            // Step 2: Create burn transaction
            const burnTx = await this.createBurnTransaction(tokenId, amount);

            // Step 3: Sign and submit transaction
            const burnResult = await this.signAndSubmitBurn(burnTx);

            // Step 4: Generate burn proof for Midnight contract
            const burnProof = await this.generateBurnProof(tokenId, amount, burnResult);

            console.log('✅ LAYLAA token burn completed successfully');
            return {
                success: true,
                burnResult: burnResult,
                burnProof: burnProof,
                tokenId: tokenId,
                amount: amount
            };
        } catch (error) {
            console.error('❌ Error in LAYLAA token burn process:', error);
            throw error;
        }
    }

    // Verify token ownership before burning
    async verifyTokenOwnership(tokenId) {
        try {
            const tokenInfo = await this.laceAPI.xrp.getTokenInfo({
                tokenId: tokenId
            });

            return tokenInfo.owner === this.xrpWallet.address;
        } catch (error) {
            console.error('❌ Error verifying token ownership:', error);
            return false;
        }
    }

    // Generate burn proof for Midnight ZKP verification
    async generateBurnProof(tokenId, amount, burnResult) {
        try {
            console.log('🔍 Generating burn proof for Midnight contract...');
            
            // Get transaction details for proof
            const txDetails = await this.laceAPI.xrp.getTransaction({
                hash: burnResult.transactionHash
            });

            // Get ledger information
            const ledgerInfo = await this.laceAPI.xrp.getLedger({
                ledgerIndex: burnResult.ledgerIndex
            });

            // Create burn proof structure for Midnight ZKP
            const burnProof = {
                // Core burn information
                transactionHash: burnResult.transactionHash,
                tokenId: tokenId,
                tokenSymbol: this.tokenSymbol,
                amount: amount,
                burnerAddress: this.xrpWallet.address,
                
                // Blockchain verification data
                blockHeight: burnResult.ledgerIndex,
                ledgerHash: ledgerInfo.ledgerHash,
                timestamp: Math.floor(Date.now() / 1000),
                
                // Transaction details for ZKP proof
                transactionDetails: {
                    account: txDetails.Account,
                    fee: txDetails.Fee,
                    sequence: txDetails.Sequence,
                    memos: txDetails.Memos || []
                },
                
                // Proof components for ZKP verification
                proofComponents: {
                    walletSignature: txDetails.Signers || [],
                    ledgerProof: {
                        ledgerIndex: burnResult.ledgerIndex,
                        ledgerHash: ledgerInfo.ledgerHash,
                        closeTime: ledgerInfo.closeTime
                    },
                    accountProof: {
                        address: this.xrpWallet.address,
                        publicKey: this.xrpWallet.publicKey,
                        network: this.xrpWallet.network
                    }
                }
            };

            // Generate proof hash for uniqueness
            burnProof.proofHash = await this.generateProofHash(burnProof);

            console.log('✅ Burn proof generated:', burnProof.proofHash);
            return burnProof;
        } catch (error) {
            console.error('❌ Error generating burn proof:', error);
            throw error;
        }
    }

    // Generate cryptographic hash of burn proof
    async generateProofHash(burnProof) {
        const proofString = JSON.stringify({
            transactionHash: burnProof.transactionHash,
            tokenId: burnProof.tokenId,
            amount: burnProof.amount,
            burnerAddress: burnProof.burnerAddress,
            blockHeight: burnProof.blockHeight,
            timestamp: burnProof.timestamp
        });

        // Use Web Crypto API for hashing
        const encoder = new TextEncoder();
        const data = encoder.encode(proofString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Convert string to hex for XRPL memos
    convertStringToHex(str) {
        return Buffer.from(str, 'utf8').toString('hex').toUpperCase();
    }

    // Convert hex to string for reading XRPL memos
    convertHexToString(hex) {
        return Buffer.from(hex, 'hex').toString('utf8');
    }

    // Get wallet connection status
    getConnectionStatus() {
        return {
            connected: this.walletConnected,
            wallet: this.xrpWallet,
            network: this.xrpWallet?.network || null
        };
    }

    // Disconnect wallet
    async disconnect() {
        try {
            if (this.laceAPI && this.walletConnected) {
                await this.laceAPI.xrp.disconnect();
            }
            
            this.walletConnected = false;
            this.xrpWallet = null;
            console.log('✅ Wallet disconnected');
        } catch (error) {
            console.error('❌ Error disconnecting wallet:', error);
        }
    }
}

module.exports = LaceXRPLIntegration;
