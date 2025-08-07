import {
    LightningElement,
    api,
    track,
    wire
} from 'lwc';
import LightningModal from 'lightning/modal';
import {
    loadStyle,
    loadScript
} from "lightning/platformResourceLoader";
import cryptojs from '@salesforce/resourceUrl/CryptoJS';
import stellar1 from '@salesforce/resourceUrl/StellarSDK';
import saveDEXOffer from '@salesforce/apex/StroopForceTradeSettingService.saveDEXOffer';


export default class StroopForceOfferModalCmp extends LightningModal {


    @track sideOpts = [{
            label: 'Select an option',
            value: 'empty-select'
        },
        {
            label: 'Buy',
            value: 'buy',

        },
        {
            label: 'Sell',
            value: 'sell'
        }
    ];

    @api offerSide;
    @api offerModalLabel;
    @api baseAssetCode;
    @api counterAssetCode;
    @api baseAssetBalance;
    @api counterAssetBalance;
    @api showEdit;
    @api showReview = false;
    @api showResult = false;
    @api targetAssetOpts = [];
    @track showSuccessIcon = false;
    @track encKey;
    @track showSpinner = false;
    @track resultMsg;
    @api pubKey;
    @api offerId = '0';
    @track showBuy = false;
    @track showSell = false;
    @track buyPrice = 0;
    @track buyAmount = 0;
    @track buyTotal = 0;
    @track sellPrice = 0;
    @track sellAmount = 0;
    @track sellTotal = 0;

    @track submitOfferButtonLabel = '';
    @track submitOfferButtonVar = 'success';
    @track buyCurrBalLabel = '';
    @track buyPriceLabel = '';
    @track buyAmountLabel = '';
    @track buyTotalLabel = '';

    @track sellCurrBalLabel = '';
    @track sellPriceLabel = '';
    @track sellAmountLabel = '';
    @track sellTotalLabel = '';


    @track spreadPrice;
    @track highestBidPriceStr = '';
    @track lowestAskPriceStr = '';
    @track spreadPriceStr = '';

    @track reviewBuySellLabel;
    @track reviewBuySellPriceLabel;
    @track reviewBuySellAmountLabel;
    @track reviewBuySellTotalLabel;

    @track confirmPrice;
    @track confirmAmount;
    @track confirmTotal;

    @track spreadDeviationPer = null;
    @track spreadDeviationAlert = false;



    @track ordBookData;
    server;

    @track ordBookCols;
    /*= [{
               label: 'Bid Price',
               fieldName: 'bidPrice',
               type: 'number',
               sortable: false,
               cellAttributes: {
                   class: "slds-theme_shade slds-theme_success",
               },
               typeAttributes: {
                   maximumFractionDigits: "7"
               }
           },
           {
               label: 'Bid Amount',
               fieldName: 'bidAmount',
               type: 'number',
               sortable: false,
               cellAttributes: {
                   class: "slds-theme_shade slds-theme_success",
               },
               typeAttributes: {
                   maximumFractionDigits: "7"
               }
           },
           {
               label: 'Bid Total',
               fieldName: 'bidTotal',
               type: 'number',
               sortable: false,
               cellAttributes: {
                   class: "slds-theme_shade slds-theme_success",
               },
               typeAttributes: {
                   maximumFractionDigits: "7"
               }
           },
           {
               label: '',
               fieldName: 'spread',
               type: 'number',
               typeAttributes: {
                   maximumFractionDigits: "7"
               }
           },
           {
               label: 'Ask Price',
               fieldName: 'askPrice',
               type: 'number',
               sortable: false,
               cellAttributes: {
                   class: "slds-theme_shade slds-theme_error",
               },
               typeAttributes: {
                   maximumFractionDigits: "7"
               }
           },
           {
               label: 'Ask Amount',
               fieldName: 'askAmount',
               type: 'number',
               sortable: false,
               cellAttributes: {
                   class: "slds-theme_shade slds-theme_error",
               },
               typeAttributes: {
                   maximumFractionDigits: "7"
               }
           },
           {
               label: 'Ask Total',
               fieldName: 'askTotal',
               type: 'number',
               sortable: false,
               cellAttributes: {
                   class: "slds-theme_shade slds-theme_error",
               },
               typeAttributes: {
                   maximumFractionDigits: "7"
               }
           }


       ];*/


    connectedCallback(){
        console.log('modal load');
    }   

    async handleOfferSideChange(e) {

        this.offerSide = e.target.value;

        if (this.offerSide === 'buy') {
            this.showBuy = true;
            this.showSell = false;
            this.submitOfferButtonLabel = 'Buy ' + this.baseAssetCode.split('-')[0];
            this.subitOfferButtonVar = 'success';
            this.buyCurrBalLabel = 'Current Balance (' + this.baseAssetCode.split('-')[0] + ')';
            this.buyPriceLabel = 'Buy Price (' + this.counterAssetCode.split('-')[0] + ')';

            this.buyAmountLabel = 'Buy Amount (' + this.baseAssetCode.split('-')[0] + ')';
            this.buyTotalLabel = 'Buy Total (' + this.counterAssetCode.split('-')[0] + ')';

        } else if (this.offerSide === 'sell') {
            this.showSell = true;
            this.showBuy = false;
            this.submitOfferButtonLabel = 'Sell ' + this.baseAssetCode.split('-')[0];
            this.submitOfferButtonVar = 'destructive';

            this.sellCurrBalLabel = 'Current Balance (' + this.baseAssetCode.split('-')[0] + ')';
            this.sellPriceLabel = 'Sell Price (' + this.counterAssetCode.split('-')[0] + ')';

            this.sellAmountLabel = 'Sell Amount (' + this.baseAssetCode.split('-')[0] + ')';
            this.sellTotalLabel = 'Sell Total (' + this.counterAssetCode.split('-')[0] + ')';

        } else {
            this.showBuy = false;
            this.showSell = false;
        }

        await this.loadServer();
        await this.getOrderbook();

    }

    handleEKChange(e) {
        this.encKey = e.target.value;
    }

    handleBuyPriceChange(e) {
        this.buyPrice = e.target.value;
        this.calcTotal();
    }

    handleBuyAmountChange(e) {
        this.buyAmount = e.target.value;
        this.calcTotal();
    }

    handleSellPriceChange(e) {
        this.sellPrice = e.target.value;
        this.calcTotal();
    }

    handleSellAmountChange(e) {
        this.sellAmount = e.target.value;
        this.calcTotal();
    }

    handleSpreadDevPerChange(e){
        this.spreadDeviationPer = e.target.value;
    }

    handleSpreadPriceClick(event) {

        console.log(event.target.value);
        console.log('offer side: ' + this.offerSide);

        if (this.offerSide === 'buy') {



            switch (event.target.value) {
                case 'AtSpread':
                    this.buyPrice = this.spreadPrice;
                    break;
                case 'OneSpread':
                    this.buyPrice = parseFloat((this.spreadPrice - (this.spreadPrice * 0.01)).toFixed(7));
                    break;
                case 'FiveSpread':
                    this.buyPrice = parseFloat((this.spreadPrice - (this.spreadPrice * 0.05)).toFixed(7));
                    break;
                case 'TenSpread':
                    this.buyPrice = parseFloat((this.spreadPrice - (this.spreadPrice * 0.10)).toFixed(7));
                    break;
                case 'TwentySpread':
                    this.buyPrice = parseFloat((this.spreadPrice - (this.spreadPrice * 0.20)).toFixed(7));
                    break;
                case 'ThirtySpread':
                    this.buyPrice = parseFloat((this.spreadPrice - (this.spreadPrice * 0.30)).toFixed(7));
                    break;

                default:
            }

        } else if (this.offerSide === 'sell') {
            console.log('processing sell price');
            let tmpSpread = parseFloat(this.spreadPrice);

            switch (event.target.value) {
                case 'AtSpread':
                    this.sellPrice = tmpSpread;
                    break;
                case 'OneSpread':
                    this.sellPrice = parseFloat((tmpSpread + (tmpSpread * 0.01)).toFixed(7));
                    break;
                case 'FiveSpread':
                    console.log('spread: ' + this.spreadPrice);
                    this.sellPrice = parseFloat((tmpSpread + (tmpSpread * 0.05)).toFixed(7));
                    console.log('sell price: ' + this.sellPrice);
                    break;
                case 'TenSpread':
                    this.sellPrice = parseFloat((tmpSpread + (tmpSpread * 0.10)).toFixed(7));
                    break;
                case 'TwentySpread':
                    this.sellPrice = parseFloat((tmpSpread + (tmpSpread * 0.20)).toFixed(7));
                    break;
                case 'ThirtySpread':
                    this.sellPrice = parseFloat((tmpSpread + (tmpSpread * 0.30)).toFixed(7));
                    break;

                default:
            }
        }



        this.calcTotal();


    }

    handleReview(e) {

        switch (this.offerSide) {

            case 'buy':
                this.reviewBuySellLabel = 'Buying';
                this.reviewBuySellPriceLabel = 'Buy Price (' + this.counterAssetCode.split('-')[0] + ')';
                this.reviewBuySellAmountLabel = 'Buy Amount (' + this.baseAssetCode.split('-')[0] + ')';
                this.reviewBuySellTotalLabel = 'Buy Total (' + this.counterAssetCode.split('-')[0] + ')';

                this.confirmPrice = this.buyPrice;
                this.confirmAmount = this.buyAmount;
                this.confirmTotal = this.buyTotal;
                break;
            case 'sell':
                this.reviewBuySellLabel = 'Selling';
                this.reviewBuySellPriceLabel = 'Sell Price (' + this.counterAssetCode.split('-')[0] + ')';
                this.reviewBuySellAmountLabel = 'Sell Amount (' + this.baseAssetCode.split('-')[0] + ')';
                this.reviewBuySellTotalLabel = 'Buy Total (' + this.counterAssetCode.split('-')[0] + ')';

                this.confirmPrice = this.sellPrice;
                this.confirmAmount = this.sellAmount;
                this.confirmTotal = this.sellTotal;

                break;
            default:
        }

        this.showReview = true;
        this.showEdit = false;
        this.showResult = false;

    }

    handleGoBack(e) {
        this.showReview = false;
        this.showResult = false;
        this.showEdit = true;
    }

    handleOkay() {


        let intervalId = window.localStorage.getItem('ob-refresh-internal-id');

        if (intervalId !== null && intervalId !== undefined && intervalId !== '') {
            clearInterval(intervalId);
            window.localStorage.removeItem('ob-refresh-internal-id');
        }

        this.close('okay');


    }

    calcTotal() {
        if (this.buyPrice && this.buyAmount && this.offerSide === 'buy') {
            this.buyTotal = this.buyPrice * this.buyAmount;
        } else if (this.sellPrice && this.sellAmount && this.offerSide === 'sell') {
            this.sellTotal = this.sellPrice * this.sellAmount;
        }
    }

    async loadServer() {

        try {
            loadScript(this, stellar1).then(() => {

                console.log('stellar sdk script loaded');
                //console.log(Horizon);
                console.log(StellarSdk);
                this.server = new StellarSdk.Horizon.Server('https://horizon.stellar.org');

                console.log(this.server);


            });

        } catch (e) {
            console.log('error');
            console.log(e);
            this.resultMsg = '<strong>Error: ' + e + '</strong>';
            this.showResult = true;
            this.showEdit = false;
            this.showReview = false;
            this.showSpinner = false;
        }

    }

    getOrderbook() {

        if (!this.server) {
            console.log('server not instatiated in get oder book');
            return;
        }

        let baseAssetCodeSplit = this.baseAssetCode.split('-');
        let counterAssetCodeSplit = this.counterAssetCode.split('-');

        const baseAsset = new StellarSdk.Asset(baseAssetCodeSplit[0], baseAssetCodeSplit[1]);
        //StellarSdk.Asset.native(); // For XLM
        const counterAsset = new StellarSdk.Asset(counterAssetCodeSplit[0], counterAssetCodeSplit[1]); // Replace with the actual issuer account ID

        console.log('asset objects instatiated');

        const orderbookCallBuilder = this.server.orderbook(baseAsset, counterAsset);

        console.log('order book call builder instatiated');

        let self = this;

        orderbookCallBuilder.limit(200).call()
            .then(function (orderbookResult) {
                console.log(JSON.stringify(orderbookResult));


                let highestBidPrice = parseFloat(orderbookResult.bids[0].price);
                let lowestAskPrice = parseFloat(orderbookResult.asks[0].price);

                self.spreadPrice = ((highestBidPrice + lowestAskPrice) / 2).toFixed(7);

                console.log('highest bid: ' + highestBidPrice);
                console.log('lowest ask: ' + lowestAskPrice);
                console.log('spread price: ' + self.spreadPrice);

                self.highestBidPriceStr = 'Highest Bid Price: ' + highestBidPrice;
                self.spreadPriceStr = 'Spread: ' + self.spreadPrice;
                self.lowestAskPriceStr = 'Lowest Ask Price: ' + lowestAskPrice;


                let intervalId = window.localStorage.getItem('ob-refresh-internal-id');

                if (intervalId !== null && intervalId !== undefined && intervalId !== '') {
                    clearInterval(intervalId);
                    window.localStorage.removeItem('ob-refresh-internal-id');
                }

                intervalId = setInterval(self.handleOBRefresh, 5000, self);
                window.localStorage.setItem('ob-refresh-internal-id', intervalId);

            })
            .catch(function (err) {
                console.error(err);
            });

    }

    handleSubmitOffer(e) {
        console.log(e.target.label);

        this.initSubmitOffer();

    }

    initSubmitOffer() {

        try {

            this.showSpinner = true;
            loadScript(this, cryptojs).then(() => {
                console.log('script loaded');
                console.log(cryptojs);

                let tmpPK = window.localStorage.getItem('pk');
                //console.log(tmpPK);
                //console.log(this.encKey);
                //let decryptVal = CryptoJS.AES.decrypt()
                let encBytes = CryptoJS.AES.decrypt(tmpPK, this.encKey);
                let decryptVal = encBytes.toString(CryptoJS.enc.Utf8);

                this.encKey = '';

                this.submitOffer(this.offerSide, decryptVal);
            })
            //this.loadServer('', 'get_swap_path');

        } catch (e) {
            console.log('error');
            console.log(e);
            this.showSpinner = false;
            this.resultMsg = '<strong>Error: ' + e + '</strong>';
            this.showResult = true;
            this.showReview = false;
            this.showEdit = false;
        }

    }

    async submitOffer(side, pk) {

        if (this.server) {

            const sourceSecretKey = pk;
            const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecretKey);

            const sellingAsset = side === 'buy' ? new StellarSdk.Asset(this.counterAssetCode.split('-')[0], this.counterAssetCode.split('-')[1]) : side === 'sell' ? new StellarSdk.Asset(this.baseAssetCode.split('-')[0], this.baseAssetCode.split('-')[1]) : null; // Selling lumens (XLM)
            const buyingAsset = side === 'buy' ? new StellarSdk.Asset(this.baseAssetCode.split('-')[0], this.baseAssetCode.split('-')[1]) : side === 'sell' ? new StellarSdk.Asset(this.counterAssetCode.split('-')[0], this.counterAssetCode.split('-')[1]) : null;

            console.log('assets instatiated');

            console.log('this buy amount: ' + this.buyAmount);

            let amt = side === 'buy' ? parseFloat(this.buyAmount).toFixed(7) : side === 'sell' ? parseFloat(this.sellAmount).toFixed(7) : '0';
            let price = side === 'buy' ? parseFloat(this.buyPrice).toFixed(7) : side === 'sell' ? parseFloat(this.sellPrice).toFixed(7) : '0';
            let offId = this.offerId;

            console.log('price and amount set');
            console.log('amt: ' + amt);
            console.log('price: ' + price);
            console.log('side: ' + side);

            if (side === 'buy') {

                console.log('setting up buy offer op');

                this.server.loadAccount(sourceKeypair.publicKey())
                    .then(account => {
                        // Create the buy offer operation
                        const buyOfferOperation = StellarSdk.Operation.manageBuyOffer({
                            selling: sellingAsset,
                            buying: buyingAsset,
                            buyAmount: '' + amt, // Amount of buying asset to buy
                            price: '' + price, // Price of 1 USDC in XLM
                            offerId: offId // Create a new offer
                        });

                        console.log('buy op set');

                        // Build the transaction
                        const transaction = new StellarSdk.TransactionBuilder(account, {
                                fee: StellarSdk.BASE_FEE * 100,
                                networkPassphrase: StellarSdk.Networks.PUBLIC, // Use the correct network
                            })
                            .addOperation(buyOfferOperation)
                            .setTimeout(10000) // Set a timeout for the transaction
                            .build();

                        console.log('buy op tx set');

                        // Sign the transaction
                        transaction.sign(sourceKeypair);

                        console.log('tx signed');

                        // Submit the transaction to Horizon
                        return this.server.submitTransaction(transaction);
                    })
                    .then(result => {
                        console.log('Transaction successful!', result);

                        this.resultMsg = '<strong>Offer to ' + this.offerSide + ' ' + this.buyAmount + ' ' + this.baseAssetCode.split('-')[0] + ' @ ' + this.buyPrice + ' ' + this.counterAssetCode.split('-')[0] +
                            ' was submitted successfully with Offer ID: ' + result.offerResults[0].currentOffer.offerId + '.</strong>';
                        this.showResult = true;
                        this.showEdit = false;
                        this.showReview = false;
                        this.showSuccessIcon = true;
                        this.showSpinner = false;

                        let tradeFlag = window.localStorage.getItem('trade-notification-flag');

                        if(tradeFlag){


                            let offerSaveRes = saveDEXOffer({
                                offerId : result.offerResults[0].currentOffer.offerId,
                                ba : buyingAsset.code + '-' + buyingAsset.issuer,
                                sa : sellingAsset.code + '-' + sellingAsset.issuer,
                                oa : '' + amt,
                                op : '' + price,
                                walletAddr : this.pubKey,
                                spreadDevPer : '' + this.spreadDeviationPer
                            });


                            console.log(offerSaveRes);

                        }
                    })
                    .catch(error => {
                        console.error('Transaction failed!', error);
                        this.showResult = true;
                        this.showEdit = false;
                        this.showReview = false;

                        this.resultMsg = '<strong>Error during offer submission: ' + error + '</strong>';

                        if (error.response && error.response.data && error.response.data.extras) {
                            const transactionResultCode = error.response.data.extras.result_codes.transaction;
                            const operationResultCodes = error.response.data.extras.result_codes.operations;

                            console.error("Transaction Result Code:", transactionResultCode);

                            if (operationResultCodes && operationResultCodes.length > 0) {
                                console.error("Operation Result Codes:", operationResultCodes);
                                this.resultMsg += '<strong>'
                                // Analyze specific operation result codes for pathPaymentStrictSend
                                operationResultCodes.forEach(opCode => {
                                    switch (opCode) {
                                        case 'PATH_PAYMENT_STRICT_SEND_MALFORMED':
                                            console.error("Path Payment Strict Send failed: Malformed input.");
                                            this.resultMsg += 'Path Payment Strict Send failed: Malformed input.';
                                            break;
                                        case 'PATH_PAYMENT_STRICT_SEND_UNDERFUNDED':
                                            console.error("Path Payment Strict Send failed: Sender account underfunded.");
                                            this.resultMsg += 'Path Payment Strict Send failed: Sender account underfunded.';
                                            break;
                                            // ... handle other PATH_PAYMENT_STRICT_SEND_ codes ...
                                        default:
                                            console.error("Path Payment Strict Send failed with code:", opCode);
                                            this.resultMsg += 'Path Payment Strict Send failed with code: ' + opCode
                                    }

                                    this.resultMsg += '</strong>';
                                });
                            }
                        } else {
                            console.error("Could not find detailed error information.");
                        }

                       



                        this.showSpinner = false;
                    });

            } else if (side === 'sell') {


                console.log('selling asset: ' + sellingAsset);
                console.log('buying asset: ' + buyingAsset);

                this.server.loadAccount(sourceKeypair.publicKey())
                    .then(account => {
                        // Create the buy offer operation
                        const sellOfferOperation = StellarSdk.Operation.manageSellOffer({
                            selling: sellingAsset,
                            buying: buyingAsset,
                            amount: '' + amt, // Amount of buying asset to buy
                            price: '' + price, // Price of 1 USDC in XLM
                            offerId: offId // Create a new offer
                        });

                        console.log('sell op set');

                        // Build the transaction
                        const transaction = new StellarSdk.TransactionBuilder(account, {
                                fee: StellarSdk.BASE_FEE * 100,
                                networkPassphrase: StellarSdk.Networks.PUBLIC, // Use the correct network
                            })
                            .addOperation(sellOfferOperation)
                            .setTimeout(10000) // Set a timeout for the transaction
                            .build();

                        console.log('buy op tx set');

                        // Sign the transaction
                        transaction.sign(sourceKeypair);

                        console.log('tx signed');

                        // Submit the transaction to Horizon
                        return this.server.submitTransaction(transaction);
                    })
                    .then(result => {
                        console.log('Transaction successful!', result);

                        this.resultMsg = '<strong>Offer to ' + this.offerSide + ' ' + this.sellAmount + ' ' + this.baseAssetCode.split('-')[0] + ' @ ' + price + ' ' + this.counterAssetCode.split('-')[0] +
                            ' was submitted successfully with Offer ID: ' + result.offerResults[0].currentOffer.offerId + '.</strong>';
                        this.showResult = true;
                        this.showEdit = false;
                        this.showReview = false;
                        this.showSuccessIcon = true;
                        this.showSpinner = false;

                        let tradeFlag = window.localStorage.getItem('trade-notification-flag');

                        if(tradeFlag){


                            let offerSaveRes = saveDEXOffer({
                                offerId : result.offerResults[0].currentOffer.offerId,
                                ba : buyingAsset.code + '-' + buyingAsset.issuer,
                                sa : sellingAsset.code + '-' + sellingAsset.issuer,
                                oa : '' + amt,
                                op : '' + price,
                                walletAddr : this.pubKey,
                                spreadDevPer : '' + this.spreadDeviationPer,
                            });


                            console.log(offerSaveRes);

                        }
                    })
                    .catch(error => {
                        console.error('Transaction failed!', error);
                        this.showResult = true;
                        this.showEdit = false;
                        this.showReview = false;

                        this.resultMsg = '<strong>Error during offer submission: ' + error + '</strong>';

                        if (error.response && error.response.data && error.response.data.extras) {
                            const transactionResultCode = error.response.data.extras.result_codes.transaction;
                            const operationResultCodes = error.response.data.extras.result_codes.operations;

                            console.error("Transaction Result Code:", transactionResultCode);

                            if (operationResultCodes && operationResultCodes.length > 0) {
                                console.error("Operation Result Codes:", operationResultCodes);
                                this.resultMsg += '<strong>'
                                // Analyze specific operation result codes for pathPaymentStrictSend
                                operationResultCodes.forEach(opCode => {
                                    switch (opCode) {
                                        case 'PATH_PAYMENT_STRICT_SEND_MALFORMED':
                                            console.error("Path Payment Strict Send failed: Malformed input.");
                                            this.resultMsg += 'Path Payment Strict Send failed: Malformed input.';
                                            break;
                                        case 'PATH_PAYMENT_STRICT_SEND_UNDERFUNDED':
                                            console.error("Path Payment Strict Send failed: Sender account underfunded.");
                                            this.resultMsg += 'Path Payment Strict Send failed: Sender account underfunded.';
                                            break;
                                            // ... handle other PATH_PAYMENT_STRICT_SEND_ codes ...
                                        default:
                                            console.error("Path Payment Strict Send failed with code:", opCode);
                                            this.resultMsg += 'Path Payment Strict Send failed with code: ' + opCode
                                    }

                                    this.resultMsg += '</strong>';
                                });
                            }
                        } else {
                            console.error("Could not find detailed error information.");
                        }



                        this.showSpinner = false;
                    });

            }
            else{
                console.log('side undetermined');
            }






        }

    }

    

    async handleOBRefresh(s) {

        console.log('refreshing order book');
        if (s.server) {
            console.log('server instantiated');
            s.getOrderbook();
        } else {
            console.log('not instatuated');
            await s.loadServer();
            s.getOrderbook();
        }

    }



}