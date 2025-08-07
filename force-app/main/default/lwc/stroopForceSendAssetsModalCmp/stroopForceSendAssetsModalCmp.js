import { LightningElement, api, track, wire } from 'lwc';
import LightningModal from 'lightning/modal';
import { loadStyle, loadScript } from "lightning/platformResourceLoader";
import cryptojs from '@salesforce/resourceUrl/CryptoJS';
import stellar1 from '@salesforce/resourceUrl/StellarSDK';

export default class StroopForceSendAssetsModalCmp extends LightningModal {


    @api assetCode;
    @api assetIssuer;
    @api pubKey;
    @track sendAmount = 0;
    @track toAddr = '';
    @api assetBalance;
    @api showEdit;
    @api showReview = false;
    @api showResult = false;
    @track showSuccessIcon = false;
    @track encKey;
    @track showSpinner = false;
    @track resultMsg;
    server;
    

    handleOkay() {
        this.close('okay');
    }

    handleSendAmountChange(e){

        this.sendAmount = parseFloat(e.target.value);

    }

    handleToAddrChange(e){
        this.toAddr = e.target.value;
    }

    handleReview(e){
        this.showEdit = false;
        this.showReview = true;
    }

    handleAssetSend(e){
        console.log('sending assets');
        this.showSpinner = true;

        try{
            loadScript(this, cryptojs).then(() => {
                console.log('script loaded');
                console.log(cryptojs);

                let tmpPK = window.localStorage.getItem('pk');
                console.log(tmpPK);
                console.log(this.encKey);
                //let decryptVal = CryptoJS.AES.decrypt()
                let encBytes = CryptoJS.AES.decrypt(tmpPK, this.encKey);
                let decryptVal = encBytes.toString(CryptoJS.enc.Utf8);
                
                this.encKey = '';

                this.loadServer(decryptVal);
              })
        
        }
        catch(e){
            console.log('error');
            console.log(e);
            this.showSpinner = false;
            this.resultMsg = '<strong>Error: ' + e + '</strong>';
            this.showResult = true;
            this.showReview = false;
            this.showEdit = false;
        }
    }

    async sendAssets(pk){

 
        const sourceSecretKey = pk; 
        const destinationPublicKey = this.toAddr;
        console.log('send amount: ' + this.sendAmount);
        console.log('to addr: ' + this.toAddr);

        // Load source account details
        const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecretKey);
        const sourceAccount = await this.server.loadAccount(sourceKeypair.publicKey());

       
        const sendAsset = this.assetCode === 'XLM' ? StellarSdk.Asset.native() : new StellarSdk.Asset(this.assetCode.split('-')[0], this.assetIssuer);

        // Build the transaction
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
            fee: StellarSdk.BASE_FEE * 50, // Use appropriate fee
            networkPassphrase: StellarSdk.Networks.PUBLIC, 
        })
        .addOperation(StellarSdk.Operation.payment({
        destination: destinationPublicKey,
        asset: sendAsset,
        amount: '' + this.sendAmount, // Amount to send
    }))
    .setTimeout(10000) // Set a reasonable timeout
    .build();

    // Sign the transaction
    transaction.sign(sourceKeypair);

    // Submit the transaction
    try {
        const transactionResult = await this.server.submitTransaction(transaction);
        console.log('Success!', transactionResult);
        this.showSpinner = false;
        this.showSpinner = false;
        this.showSuccessIcon = true;
        this.resultMsg = '<strong>Successfully sent ' + this.sendAmount + ' ' + this.assetCode.split('-')[0] + ' to ' + this.toAddr + '</strong>';
        this.showResult = true;
        this.showReview = false;
        this.showEdit = false;
    }catch (e) {
        console.error('An error has occurred:', e);
        this.showSpinner = false;
        this.showSpinner = false;
        this.resultMsg = '<strong>Error: ' + e + '</strong>';
        this.showResult = true;
        this.showReview = false;
        this.showEdit = false;
    }


    }

    handleGoBack(e){
        this.showReview = false;
        this.showEdit = true;
    }

    handleEKChange(e){
        this.encKey = e.target.value;
    }

    async loadServer(pk){

        try{
            loadScript(this, stellar1).then(() => {
                
                console.log('stellar sdk script loaded');
                //console.log(Horizon);
                console.log(StellarSdk);
                this.server = new StellarSdk.Horizon.Server('https://horizon.stellar.org');

                console.log(this.server);

                this.sendAssets(pk);
                //var acc =  await this.server.loadAccount(window.localStorage.getItem('pub-key'));


                
              });
        
        }
        catch(e){
            console.log('error');
            console.log(e);
            this.resultMsg = '<strong>Error: ' + e + '</strong>';
            this.showResult = true;
            this.showEdit = false;
            this.showReview = false;
            this.showSpinner = false;
        }

    }

}