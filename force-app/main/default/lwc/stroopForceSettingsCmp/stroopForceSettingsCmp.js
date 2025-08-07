import { LightningElement, api, track, wire } from 'lwc';
import LightningAlert from 'lightning/alert';
import { loadStyle, loadScript } from "lightning/platformResourceLoader";
import cryptojs from '@salesforce/resourceUrl/CryptoJS';
import saveSetting from '@salesforce/apex/StroopForceTradeSettingService.saveSetting';
import initTradeNotificationScheduler from '@salesforce/apex/StroopForceTradeSettingService.initTradeNotificationScheduler';
import deleteTradeNotificationScheduler from '@salesforce/apex/StroopForceTradeSettingService.deleteTradeNotificationScheduler';





export default class StroopForceSettingsCmp extends LightningElement {




    @track ek;
    @track walletAddr = '';
    @track pk;
    @track showSpinner;
    @track tradeNotOffBtnVariant;
    @track tradeNotOnBtnVariant
    @track emailAddr;
    

    connectedCallback(){
        /*loadScript(this, CryptoJS).then(() => {
            console.log('script loaded');
          });*/

        this.walletAddr = window.localStorage.getItem('pub-key');
        this.showSpinner = false;
        let tradeNoteFlag = window.localStorage.getItem('trade-notification-flag');

        if(tradeNoteFlag){
            this.tradeNotOnBtnVariant = 'brand';
            this.tradeNotOffBtnVariant = 'neutral';
        }
        else{
            this.tradeNotOnBtnVariant = 'neutral';
            this.tradeNotOffBtnVariant = 'brand';
        }
    }


    handleWalletAddrChange(e){
        this.walletAddr = e.target.value;
    }

    handlePKChange(e){
        this.pk = e.target.value;
    }

    handleEncKeyChange(e){
        this.ek = e.target.value;
    }

    handleSettingsSave(e){

        this.showSpinner = true;

        if(this.ek === '' || this.ek === null || this.ek === undefined){

            this.showSpinner = false;
            this.showAlert('Settings saved successfully');

        }

        console.log('wallet addr:' + this.walletAddr);
        window.localStorage.setItem('pub-key', this.walletAddr);

        let encVal = this.encryptKey(this.ek, this.pk);

        console.log('pkey: ' + this.pk);
        console.log('enc key: ' + this.ek);
        console.log('encrypted val: ' + encVal);
    }


     encryptKey(encKey, pKey) {
        //const plaintext = 'Sensitive data to encrypt';
        //const encryptionKey = 'YourSecretKey'; // Use a strong, securely managed key

        // Encrypt the plaintext using AES

        try{
            loadScript(this, cryptojs).then(() => {
                console.log('script loaded');
                console.log(cryptojs);
                const ciphertext = CryptoJS.AES.encrypt(pKey, encKey).toString();
                
                window.localStorage.setItem('pk', ciphertext);

                let tmpPK = window.localStorage.getItem('pk');
                //let decryptVal = CryptoJS.AES.decrypt()
                let encBytes = CryptoJS.AES.decrypt(tmpPK, this.ek);
                let decryptVal = encBytes.toString(CryptoJS.enc.Utf8);

                //console.log('de: ' + decryptVal);

                this.pk = '';
                this.ek = '';
                this.showSpinner = false;
                this.showAlert('Settings saved successfully', 'success', 'Save Result');
                
              })
        
        }
        catch(e){
            console.log('error');
            console.log(e);
            this.showSpinner = false;
        }

        return ciphertext;

    }

    async showAlert(msg, theme, label){
        await LightningAlert.open({
            message: msg,
            theme: theme,
            label : label
        });

    }

    handleEmailAddrChange(e){
        //window.localStorage.setItem('notification-email', e.target.value);
        this.emailAddr = e.target.value;
    }

    async handleTradeNotOff(e){
        this.tradeNotOffBtnVariant = 'brand';
        this.tradeNotOnBtnVariant = 'neutral';
        window.localStorage.setItem('trade-notification-flag', false);
        let msg = 'This will turn off any trade notifications for any existing or future offers. Any offer IDs and email address will also be deleted from any Salesforce object records';
        this.showAlert(msg, 'warning', 'Trade Notification Message');

        let saveRes = await saveSetting({
            walletAddr : window.localStorage.getItem('pub-key'),
            emailAddr : this.emailAddr,
            active : false
        });

        console.log(saveRes);

        if(saveRes !== 'success'){
            msg = saveRes;
            this.showAlert(msg, 'error', 'Trade Notification Message');
        }

        let schedulerRes = await deleteTradeNotificationScheduler({
            walletAddr  : window.localStorage.getItem('pub-key')
        });

        console.log(schedulerRes);
    }

    async handleTradeNotOn(e){
        this.tradeNotOnBtnVariant = 'brand';
        this.tradeNotOffBtnVariant = 'neutral';
        window.localStorage.setItem('trade-notification-flag', true);
        this.showAlert('Note that next time you place a trade with Stroop Force, your notification email address, public wallet address and offer IDs will be stored in a Salesforce object record. You also are also agreeing to receive email notitifcations from Salesforce regarding trade fills', 'warning', 'Trade Notification Message');
        
        let saveRes = await saveSetting({
            walletAddr : window.localStorage.getItem('pub-key'),
            emailAddr : this.emailAddr,
            active : true
        });

        console.log(saveRes);

        if(saveRes !== 'success'){
            msg = saveRes;
            this.showAlert(msg, 'error', 'Trade Notification Message');
        }

        let schedulerRes = await initTradeNotificationScheduler({
            walletAddr : window.localStorage.getItem('pub-key')
        });

        console.log(schedulerRes);
    }



}