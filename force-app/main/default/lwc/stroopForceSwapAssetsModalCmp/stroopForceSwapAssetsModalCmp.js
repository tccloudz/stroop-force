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

export default class StroopForceSwapAssetsModalCmp extends LightningModal {


    @api sourceAssetCode;
    @api sourceAssetIssuer;
    @api pubKey;
    @track swapAmount = 0;
    @api sourceAssetBalance;
    @api showEdit;
    @api showReview = false;
    @api showResult = false;
    @api targetAssetOpts = [];
    @track showSuccessIcon = false;
    @track encKey;
    @track showSpinner = false;
    @track resultMsg;
    @track targetAssetBalance;
    @track targetAssetCode;
    @track swapResultAmount;
    @track swapPath;
    @track pathBreadCrumbs;
    server;




    async getSwapPath() {


        let sourceAssetCodeSplit = this.sourceAssetCode.split('-');

        const sendAsset = sourceAssetCodeSplit[0] === 'XLM' ? StellarSdk.Asset.native() : new StellarSdk.Asset(this.sourceAssetCode.split('-')[0], this.sourceAssetIssuer);

        console.log('send asset: ' + sendAsset);
        console.log('swap amount: ' + this.swapAmount);
        console.log('pub key: ' + this.pubKey);
        console.log('target asset: ' + this.targetAssetCode);


        let targetAssetSplit = this.targetAssetCode === 'XLM' ? (this.targetAssetCode + '-').split('-') : this.targetAssetCode.split('-');
        var self = this;

        this.server
            .strictSendPaths(sendAsset, this.swapAmount, this.pubKey)
            .call()
            .then(async function (paths) {
                let highestAmount = 0;
                let bestPath = null;

                console.log(JSON.stringify(paths));

                paths.records.forEach(function (path) { // access the paths array via .records
                    const receivedAmount = parseFloat(path.destination_amount);
                    console.log('current path: ' + JSON.stringify(path));
                    if (receivedAmount > highestAmount && (path.destination_asset_code === targetAssetSplit[0] ||  (path.destination_asset_type === 'native' && targetAssetSplit[0] === 'XLM')    )) {
                        highestAmount = receivedAmount;
                        bestPath = path;
                        console.log('matching code found');
                    }
                });

                if (bestPath) {
                    console.log('Path with the highest received amount:', bestPath);
                    console.log('Highest received amount:', highestAmount);
                    self.swapPath = bestPath;

                    self.swapResultAmount = highestAmount;

                    self.pathBreadCrumbs = [];

                    let tmpPath = bestPath.path;



                    let intervalId = window.localStorage.getItem('req-interval-id');

                    if (intervalId !== '' && intervalId !== null && intervalId !== undefined) {
                        clearInterval(intervalId);
                    }

                    intervalId = setInterval(self.handleRequote, 5000, self);

                    window.localStorage.setItem('req-interval-id', intervalId);


                    self.pathBreadCrumbs.push({
                        label: sendAsset.code,
                        name: sendAsset.code,
                        id: sendAsset.code
                    });

                    await tmpPath.forEach((p) => {

                        if ((p.asset_code !== '' && p.asset_code !== null && p.asset_code !== undefined) || (p.asset_type === 'native')) {
                            let pathAssetCode = p.asset_type === 'native' ? 'XLM' : p.asset_code;
                            self.pathBreadCrumbs.push({
                                label: pathAssetCode,
                                name: pathAssetCode,
                                id: pathAssetCode
                            });
                        }
                    });

                    let destAssetCode = bestPath.destination_asset_type === 'native' ? 'XLM' : bestPath.destination_asset_code;
                    self.pathBreadCrumbs.push({
                        label: destAssetCode,
                        name: destAssetCode,
                        id: destAssetCode
                    });





                } else {
                    console.log('No suitable paths found.');
                }
            })
            .catch(function (error) {
                console.error('Error finding paths:', error);
                console.log(JSON.stringify(error));
            });


    }




    initGetSwapPath() {

        try {
            /*loadScript(this, cryptojs).then(() => {
                console.log('script loaded');
                console.log(cryptojs);

                let tmpPK = window.localStorage.getItem('pk');
                console.log(tmpPK);
                console.log(this.encKey);
                //let decryptVal = CryptoJS.AES.decrypt()
                let encBytes = CryptoJS.AES.decrypt(tmpPK, this.encKey);
                let decryptVal = encBytes.toString(CryptoJS.enc.Utf8);
                
                this.encKey = '';

                this.loadServer(decryptVal, 'get_swap_path');
              })*/
            this.loadServer('', 'get_swap_path');

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

    async loadServer(pk, actionType) {

        try {
            loadScript(this, stellar1).then(() => {

                console.log('stellar sdk script loaded');
                //console.log(Horizon);
                console.log(StellarSdk);
                this.server = new StellarSdk.Horizon.Server('https://horizon.stellar.org');

                console.log(this.server);

                switch (actionType) {
                    case 'get_swap_path':
                        this.getSwapPath();
                        break;
                    case 'swap_assets':
                        console.log('swapping assets');
                        this.swapAssets(pk);
                        break;

                    default:
                }
                //var acc =  await this.server.loadAccount(window.localStorage.getItem('pub-key'));



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


    async swapAssets(pk) {

        console.log('swap assets entered');
        const sourceKeypair = StellarSdk.Keypair.fromSecret(pk);
        const sourceAccount = await this.server.loadAccount(sourceKeypair.publicKey());

        console.log('account loaded');
        const networkPassphrase = StellarSdk.Networks.PUBLIC;

        console.log('network passphrase set');
        let sourceAssetCodeSplit = this.sourceAssetCode.split('-');
        let targetAssetCodeSplit = this.targetAssetCode.split('-');

        
        console.log('split occurred');
        console.log(sourceAssetCodeSplit);
        console.log(targetAssetCodeSplit)

        const sendAsset = sourceAssetCodeSplit[0] === 'XLM' ? StellarSdk.Asset.native() : new StellarSdk.Asset(sourceAssetCodeSplit[0], sourceAssetCodeSplit[1]);

        const destAsset =  targetAssetCodeSplit.length === 1 && targetAssetCodeSplit[0] === 'XLM' ? StellarSdk.Asset.native() : new StellarSdk.Asset(targetAssetCodeSplit[0], targetAssetCodeSplit[1]); // Receiving a custom asset

        console.log('assets instantiated');
        let swapPathArr = this.swapPath.path;
        let swapPathParam = [];

        for (let i = 0; i < swapPathArr.length; i++) {
            if (swapPathArr[i].asset_code !== '' && swapPathArr[i].asset_code !== null && swapPathArr[i].asset_code !== undefined) {
                let pathAsset = swapPathArr[i].asset_issuer === 'native' ? StellarSdk.Asset.native() : new StellarSdk.Asset(swapPathArr[i].asset_code, swapPathArr[i].asset_issuer);
                console.log('path asset: ');
                console.log(pathAsset);
                swapPathParam.push(pathAsset);

            }
        }

        console.log('swap path: ');
        console.log(JSON.stringify(swapPathParam));

        const sendAmount = '' + this.swapAmount; // Amount of sendAsset to send
        const destMin = '' + (parseFloat(this.swapResultAmount) * 0.95).toFixed(4); // Minimum amount of destAsset to receive
        console.log('min amt: ' + destMin);
        const destinationAccountPublicKey = this.pubKey;
        //destMin = destMin.toString()
        const pathPaymentOp = StellarSdk.Operation.pathPaymentStrictSend({
            sendAsset,
            sendAmount,
            destination: destinationAccountPublicKey,
            destAsset,
            destMin,
            //swapPathParam, // Optional: include if using a path
        });


        console.log('op instatiated');

        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
                networkPassphrase,
                fee: StellarSdk.BASE_FEE * 300, // Set a reasonable fee (e.g., 100 stroops per operation)
            })
            .addOperation(pathPaymentOp)
            .setTimeout(10000) // Set a timeout for the transaction
            .build();

         console.log('tx built');   

        transaction.sign(sourceKeypair);

        console.log('tx signed');

        try {
            const transactionResult = await this.server.submitTransaction(transaction);
            console.log('Transaction successful:', transactionResult);
            this.showSpinner = false;
            this.showEdit = false;
            this.showReview = false;
            this.showResult = true;
            this.showSuccessIcon = true;
            this.resultMsg = '<strong>Successfully swapped ' + this.swapAmount + ' ' + sendAsset.code + ' for ' + this.swapResultAmount + ' ' + destAsset.code + '.</strong>';
        } catch (error) {
            console.error('Error submitting transaction:', error);
            this.showSpinner = false;
            this.resultMsg = '<strong>Error: ' + error + '</strong><br/><br/>';
            this.showResult = true;
            this.showReview = false;
            this.showEdit = false;

            if (error.response && error.response.data && error.response.data.extras) {
                const transactionResultCode = error.response.data.extras.result_codes.transaction;
                const operationResultCodes = error.response.data.extras.result_codes.operations;
            
                console.error("Transaction Result Code:", transactionResultCode);
            
                if (operationResultCodes && operationResultCodes.length > 0) {
                  console.error("Operation Result Codes:", operationResultCodes);
            
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
                  });
                }
              } else {
                console.error("Could not find detailed error information.");
              }
        }



    }





    handleSwapAmountChange(e) {

        this.swapAmount = e.target.value;

        if (this.swapAmount && this.targetAssetCode) {
            this.initGetSwapPath();
        }

    }

    handleTargetAssetChange(e) {
        this.targetAssetCode = e.detail.value;

        console.log(this.targetAssetCode);

        let assetBals = JSON.parse(window.localStorage.getItem('asset-balances'));

        if (assetBals) {
            for (let i = 0; i < assetBals.length; i++) {
                this.targetAssetBalance = assetBals[i].asset === this.targetAssetCode ? assetBals[i].balance : this.targetAssetBalance;
            }
        }

        if (this.targetAssetCode && this.swapAmount) {
            this.initGetSwapPath();
        }
    }

    handleEKChange(e) {
        this.encKey = e.target.value;
    }

    handleReview(e) {
        this.showEdit = false;
        this.showResult = false;
        this.showReview = true;

    }

    handleGoBack(e) {

        this.showResult = false;
        this.showReview = false;
        this.showEdit = true;

        let intervalId = window.localStorage.getItem('req-interval-id');

        if (intervalId) {
            clearInterval(intervalId);
        }

    }

    handleAssetSwap(e) {

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

                this.loadServer(decryptVal, 'swap_assets');
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

    handleRequote(s) {

        console.log('running requote');
        //if(this.swapAmount && this.targetAssetCode && this.sourceAssetCode){
        s.getSwapPath();
        //}
    }

    handleOkay() {
        let intervalId = window.localStorage.getItem('req-interval-id');

        if (intervalId) {
            clearInterval(intervalId);
        }

        this.close('okay');
    }


}