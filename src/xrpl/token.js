// XRPL Token Management for LAYLAA token
const xrpl = require('xrpl');
const crypto = require('crypto');

class LAYLAAToken {
    constructor(client, wallet) {
        this.client = client;
        this.wallet = wallet;
        this.tokenName = 'LAYLAA';
        this.tokenSymbol = 'LAYLAA';
        this.decimals = 6;
    }

    // Create LAYLAA token on XRPL
    async createToken(initialSupply) {
        try {
            const tokenCreateTx = {
                TransactionType: 'NFTokenMint',
                Account: this.wallet.address,
                NFTokenTaxon: 0, // Unique identifier for token type
                Flags: 8, // Transferable flag
                Memos: [{
                    Memo: {
                        MemoData: xrpl.convertStringToHex(`LAYLAA Token - Initial Supply: ${initialSupply}`)
                    }
                }]
            };

            const prepared = await this.client.autofill(tokenCreateTx);
            const signed = this.wallet.sign(prepared);
            const result = await this.client.submitAndWait(signed.tx_blob);

            if (result.result.meta.TransactionResult === 'tesSUCCESS') {
                const nftId = result.result.meta.nftoken_id;
                console.log(`✅ LAYLAA Token created with ID: ${nftId}`);
                return {
                    success: true,
                    tokenId: nftId,
                    transactionHash: result.result.hash
                };
            } else {
                throw new Error(`Token creation failed: ${result.result.meta.TransactionResult}`);
            }
        } catch (error) {
            console.error('❌ Error creating LAYLAA token:', error);
            throw error;
        }
    }

    // Get token balance for an address
    async getTokenBalance(address) {
        try {
            const accountNfts = await this.client.request({
                command: 'account_nfts',
                account: address
            });

            const laylaaTokens = accountNfts.result.account_nfts.filter(nft => 
                nft.NFTokenTaxon === 0 && // Our token identifier
                nft.Flags === 8 // Transferable
            );

            return {
                balance: laylaaTokens.length,
                tokens: laylaaTokens
            };
        } catch (error) {
            console.error('❌ Error getting token balance:', error);
            throw error;
        }
    }

    // Get token information
    async getTokenInfo(tokenId) {
        try {
            const nftInfo = await this.client.request({
                command: 'nft_info',
                nft_id: tokenId
            });

            return {
                tokenId: nftInfo.result.nft_id,
                owner: nftInfo.result.owner,
                flags: nftInfo.result.flags,
                taxon: nftInfo.result.taxon,
                uri: nftInfo.result.uri
            };
        } catch (error) {
            console.error('❌ Error getting token info:', error);
            throw error;
        }
    }

    // Generate burn proof data for ZKB verification
    async generateBurnProofData(tokenId, burnAmount) {
        try {
            // Get current ledger info for proof context
            const ledgerInfo = await this.client.request({
                command: 'ledger_current'
            });

            const burnData = {
                tokenId: tokenId,
                tokenSymbol: this.tokenSymbol,
                amount: burnAmount,
                burnerAddress: this.wallet.address,
                blockHeight: ledgerInfo.result.ledger_current_index,
                timestamp: Date.now(),
                nonce: crypto.randomBytes(32).toString('hex')
            };

            // Create hash for burn verification
            const burnHash = crypto.createHash('sha256').update(
                JSON.stringify(burnData)
            ).digest('hex');

            return {
                burnData,
                burnHash,
                ledgerIndex: ledgerInfo.result.ledger_current_index
            };
        } catch (error) {
            console.error('❌ Error generating burn proof data:', error);
            throw error;
        }
    }

    // Verify token exists and is owned by burner
    async verifyTokenOwnership(tokenId, ownerAddress) {
        try {
            const nftInfo = await this.getTokenInfo(tokenId);
            return nftInfo.owner === ownerAddress;
        } catch (error) {
            console.error('❌ Error verifying token ownership:', error);
            return false;
        }
    }
}

module.exports = LAYLAAToken;
