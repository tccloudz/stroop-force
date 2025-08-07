import {
    LightningElement,
    api,
    track,
    wire
} from 'lwc';
import LightningModal from 'lightning/modal';
import LightningAlert from 'lightning/alert';
import {
    loadStyle,
    loadScript
} from "lightning/platformResourceLoader";
import cryptojs from '@salesforce/resourceUrl/CryptoJS';
import stellar1 from '@salesforce/resourceUrl/StellarSDK';
import deleteDEXOffer from '@salesforce/apex/StroopForceTradeSettingService.deleteDEXOffer';

export default class StroopForceViewOffersModalCmp extends LightningModal {

    @api pubKey;
    @track offersData;
    @track offerCols;
    @track showSpinner;
    @track showOffers;
    @track showCancelConfirm = true;
    @track cancelOfferId;
    @track encKey;
    @track resultMsg;
    server;


    async connectedCallback() {
        console.log('view offers modal loaded');

        this.showCancelConfirm = false;
        this.showOffers = true;
        await this.loadServer();
        await this.getOffers();
    }

    handleEKChange(e){
        this.encKey = e.target.value;
    }

    handleClose(e) {
        this.showCancelConfirm = false;
        this.showOffers = true;
        this.close('close');
    }

    handleGoBack(e){
        this.showCancelConfirm = false;
        this.showOffers = true;
    }

    handleOfferItemClick(e){
        console.log(e.target.label);
        console.log(e.target.value);

        switch(e.target.label){

            case 'Cancel':
                //this.initCancelOffer(e.target.value);
                this.cancelOfferId = e.target.value;
                this.showOffers = false;
                this.showCancelConfirm = true;
                break;
            case 'Edit':
                let editOffer = this.getOfferById(e.target.value);
                if(editOffer){

                    let editObj = {'edit' : editOffer};
                    this.close(JSON.stringify(editObj));

                }
                else{
                    this.showAlert('Selected offer ID, ' + e.target.value + ', cannot be found for edit');
                }
                break;

            default:

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

        }

    }

    async getOffers() {

        if (!this.server) {
            return;
        } else {

            var self = this;
            this.server.offers()
                .forAccount(this.pubKey)
                .limit(200)
                .call()
                .then(function (offers) {
                    console.log(JSON.stringify(offers.records));
                    let offRecs = offers.records;
                    
                    self.offersData = [];

                    offRecs.forEach(off => {
                        console.log('setting offer object');
                        console.log(JSON.stringify(off));

                        let selling = off.selling.asset_type === 'native' ? 'XLM' : off.selling.asset_code + '-' + off.selling.asset_issuer;
                        let buying = off.buying.asset_type === 'native' ? 'XLM' : off.buying.asset_code + '-' + off.buying.asset_issuer;

                        let tmpOff = {
                            offerId : off.id,
                            selling : selling,//off.selling.asset_code + '-' + off.selling.asset_issuer,
                            buying : buying, //off.buying.asset_code + '-' + off.buying.asset_issuer,
                            price : off.price,
                            amount : off.amount
                        };

                        self.offersData.push(tmpOff);
                        console.log('added offer to array');
                        
                    });

                })
                .catch(function (err) {
                    console.error(err);
                });



        }



    }

    async initCancelOffer(){

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

                this.cancelOffer(this.cancelOfferId, decryptVal);
            })
 

        } catch (e) {
            console.log('error');
            console.log(e);
    
        }

    }

    async cancelOffer(offerId, pk){

        console.log('get selected offer');
        let offerToCancel = this.getOfferById(offerId);
        

        if(offerToCancel === null){
            console.log('seleted offer not found');
        }
        else{
            console.log('selected offer found');
            if(this.server){

                const sourceSecretKey = pk;
                const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecretKey);

                console.log('d');

                const sellingAsset =   offerToCancel.selling === 'XLM' ?  StellarSdk.Asset.native() :  new StellarSdk.Asset(offerToCancel.selling.split('-')[0], offerToCancel.selling.split('-')[1]) ;
                const buyingAsset = offerToCancel.buying === 'XLM' ? StellarSdk.Asset.native() : new StellarSdk.Asset(offerToCancel.buying.split('-')[0], offerToCancel.buying.split('-')[1]);

                console.log('assets instantiated');

                console.log('selling: ' + sellingAsset);
                console.log('buying: ' + buyingAsset) ;
                console.log('offer id: ' + offerId);

                this.server.loadAccount(sourceKeypair.publicKey())
                    .then(account => {
                        // Create the buy offer operation
                        const buyOfferOperation = StellarSdk.Operation.manageBuyOffer({
                            selling: sellingAsset ,
                            buying: buyingAsset,
                            buyAmount: '0', // Amount of buying asset to buy
                            price: '1', // Price of 1 USDC in XLM
                            offerId: '' + offerId // Create a new offer
                        });

                        console.log('cancel op set');

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

                        /*this.resultMsg = '<strong>Offer to ' + this.offerSide + ' ' + this.buyAmount + ' ' + this.baseAssetCode.split('-')[0] + ' @ ' + this.buyPrice + ' ' + this.counterAssetCode.split('-')[0] +
                            ' was submitted successfully with Offer ID: ' + result.offerResults[0].currentOffer.offerId + '.</strong>';
                        this.showResult = true;
                        this.showEdit = false;
                        this.showReview = false;
                        this.showSuccessIcon = true;*/
                        this.showSpinner = false;

                        this.showAlert('Offer canceled successfully!', 'success', 'Cancel Offer Result');

                        this.showOffers = true;
                        this.showCancelConfirm = false;
                        this.getOffers();

                        let tradeFlag = window.localStorage.getItem('trade-notification-flag');

                        if(tradeFlag){


                            let offerDelRes = deleteDEXOffer({
                                offerId : offerId,
                                
                            });


                            console.log(offerDelRes);

                        }

                    })
                    .catch(error => {
                        console.error('Transaction failed!', error);
                        //this.showResult = true;
                        //this.showEdit = false;
                        //this.showReview = false;

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
                                            //this.resultMsg += 'Path Payment Strict Send failed: Malformed input.';
                                            break;
                                        case 'PATH_PAYMENT_STRICT_SEND_UNDERFUNDED':
                                            console.error("Path Payment Strict Send failed: Sender account underfunded.");
                                            //this.resultMsg += 'Path Payment Strict Send failed: Sender account underfunded.';
                                            break;
                                            // ... handle other PATH_PAYMENT_STRICT_SEND_ codes ...
                                        default:
                                            console.error("Path Payment Strict Send failed with code:", opCode);
                                           // this.resultMsg += 'Path Payment Strict Send failed with code: ' + opCode
                                    }

                                    this.showAlert('Offer cancellation failed: ' + opCode, 'error', 'Cancel Offer Result');

                                    this.resultMsg += '</strong>';
                                });
                            }
                        } else {
                            console.error("Could not find detailed error information.");
                            console.log(JSON.stringify(error));
                        }



                        this.showSpinner = false;
                        this.showOffers = true;
                        this.showCancelConfirm = false;
                    });



            }



        }


    }

    async showAlert(msg, theme, label){
        await LightningAlert.open({
            message: msg,
            theme: theme,
            label : label
        });

    }

    getOfferById(offId){

        let offData = this.offersData;
        let selOff = null;
        for(let i = 0; i < offData.length; i++){
            selOff = offData[i].offerId === offId ? offData[i] : selOff;
        }

        return selOff;
    }
}