import {
    LightningElement,
    wire,
    track,
    api
} from 'lwc';
import LightningModal from 'lightning/modal';
import OfferModal from 'c/stroopForceOfferModalCmp';
import ViewOffersModal from 'c/stroopForceViewOffersModalCmp';
import ViewTradeHistModal from 'c/stroopForceTradeHistoryModalCmp';
import {
    loadStyle,
    loadScript
} from "lightning/platformResourceLoader";
import cryptojs from '@salesforce/resourceUrl/CryptoJS';
import stellar1 from '@salesforce/resourceUrl/StellarSDK';

export default class StroopForceTradeCmp extends LightningElement {



    @api assetOpts = [];
    @api pubKey;
    @track ordBookBidCols;
    @track ordBookBidData;
    @track ordBookAskCols;
    @track ordBookAskData;
    @track baseAssetCode;
    @track counterAssetCode;
    @track spreadPrice;
    @track spreadPriceStr;
    editOffer;
    server;


    connectedCallback() {

        this.ordBookBidCols = [{
                label: 'Bid Price',
                fieldName: 'bidPrice',
                type: 'number',
                sortable: false,
                cellAttributes: {
                    class: "slds-theme_shade slds-theme_success",
                },
                typeAttributes: { maximumFractionDigits: "7" }
            },
            {
                label: 'Bid Amount',
                fieldName: 'bidAmount',
                type: 'number',
                sortable: false,
                cellAttributes: {
                    class: "slds-theme_shade slds-theme_success",
                },
                typeAttributes: { maximumFractionDigits: "7" }
            },
            {
                label: 'Bid Total',
                fieldName: 'bidTotal',
                type: 'number',
                sortable: false,
                cellAttributes: {
                    class: "slds-theme_shade slds-theme_success",
                },
                typeAttributes: { maximumFractionDigits: "7" }
            },
            
            


        ];

        this.ordBookAskCols = [
            {
                label: 'Ask Price',
                fieldName: 'askPrice',
                type: 'number',
                sortable: false,
                cellAttributes: {
                    class: "slds-theme_shade slds-theme_error",
                },
                typeAttributes: { maximumFractionDigits: "7" }
            },
            {
                label: 'Ask Amount',
                fieldName: 'askAmount',
                type: 'number',
                sortable: false,
                cellAttributes: {
                    class: "slds-theme_shade slds-theme_error",
                },
                typeAttributes: { maximumFractionDigits: "7" }
            },
            {
                label: 'Ask Total',
                fieldName: 'askTotal',
                type: 'number',
                sortable: false,
                cellAttributes: {
                    class: "slds-theme_shade slds-theme_error",
                },
                typeAttributes: { maximumFractionDigits: "7" }
            }
        ]


        let assetBals = JSON.parse(window.localStorage.getItem('asset-balances'));
        this.assetOpts = [{label: 'Select an option', value : 'empty-select'}];
        for (let i = 0; i < assetBals.length; i++) {
            let tgtAsset = {
                label: assetBals[i].asset,
                value: assetBals[i].asset
            }

            this.assetOpts.push(tgtAsset);
        }

        this.editOffer = null;

        this.loadServer();


    }

    handleBaseAssetChange(event) {

        this.baseAssetCode = event.target.value;

        if (this.baseAssetCode !== '' && this.baseAssetCode !== null && this.baseAssetCode !== undefined &&
            this.counterAssetCode !== '' && this.counterAssetCode !== null && this.counterAssetCode !== undefined && this.baseAssetCode !== 'empty-select' && this.counterAssetCode !== 'empty-select'
        ) {

            this.getOrderbook();

        }
    }

    handleCounterAssetChange(event) {

        this.counterAssetCode = event.target.value;

        if (this.baseAssetCode !== '' && this.baseAssetCode !== null && this.baseAssetCode !== undefined &&
            this.counterAssetCode !== '' && this.counterAssetCode !== null && this.counterAssetCode !== undefined && this.baseAssetCode !== 'empty-select' && this.counterAssetCode !== 'empty-select'
        ) {

            this.getOrderbook();
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

                self.spreadPriceStr = 'Spread: ' + self.spreadPrice;

                let bidArrLen = orderbookResult.bids.length;
                let askArrLen = orderbookResult.asks.length;
                let higherLen = bidArrLen > askArrLen ? bidArrLen : askArrLen;

                self.ordBookBidData = [];
                self.ordBookAskData = [];

                for(let i = 0; i <  orderbookResult.bids.length; i++){


                    let tmpRow = {};

                    tmpRow.bidPrice =  parseFloat(orderbookResult.bids[i].price);
                    tmpRow.bidAmount = parseFloat(( parseFloat(orderbookResult.bids[i].amount) / parseFloat(orderbookResult.bids[i].price) ).toFixed(7));
                    tmpRow.bidTotal = parseFloat(orderbookResult.bids[i].amount);

                    
                    self.ordBookBidData.push(tmpRow);

                }

                let askArrRev = orderbookResult.asks.reverse();

                for(let j = 0; j < askArrRev.length; j++){
                    let tmpRow = {};

                    tmpRow.askPrice = parseFloat(askArrRev[j].price);
                    tmpRow.askAmount = parseFloat(( parseFloat(askArrRev[j].amount / parseFloat(askArrRev[j].price) ) ).toFixed(7));
                    tmpRow.askTotal = parseFloat(askArrRev[j].amount);
                    
                    
                    self.ordBookAskData.push(tmpRow)
                }

                let intervalId = window.localStorage.getItem('ob-refresh-internal-id');

                if(intervalId !== null && intervalId !== undefined && intervalId !== '' ){
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

    async handleOBRefresh(s){

        console.log('refreshing order book');
        if(s.server){
            console.log('server instantiated');
            s.getOrderbook();
        }
        else{
            console.log('not instatuated');
            await this.loadServer();
            this.getOrderbook();
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

    async handleMakeOffer(e){


        let assetBals = JSON.parse(window.localStorage.getItem('asset-balances'));
        let baseAssetBal = 0;
        let counterAssetBal = 0;

        console.log('handlemakeoffer called');

        for(let i = 0; i < assetBals.length; i++){
            baseAssetBal = assetBals[i].asset === this.baseAssetCode ? assetBals[i].balance : baseAssetBal;
            counterAssetBal = assetBals[i].asset === this.counterAssetCode ? assetBals[i].balance : counterAssetBal;
        }

        console.log('base and counter asseet balance set');

        let intervalId = window.localStorage.getItem('ob-refresh-internal-id');

        if(intervalId){
            clearInterval(intervalId);
        }

        let tmpOffId = '0';
        let offLabel = 'Create a New Stellar DEX Offer';
        if(this.editOffer){
            tmpOffId = this.editOffer.edit.offerId;
            offLabel = 'Edit Offer with ID: ' + tmpOffId;
        }

        
        const result = await OfferModal.open({
            // `label` is not included here in this example.
            // it is set on lightning-modal-header instead
            size: 'large',
            description: 'Accessible description of modal\'s purpose',
            baseAssetCode : this.baseAssetCode,
            counterAssetCode : this.counterAssetCode,
            pubKey : window.localStorage.getItem('pub-key'),
            showEdit : true,
            showReview : false,
            counterAssetBalanace : counterAssetBal,
            baseAssetBalance : baseAssetBal,
            offerId : tmpOffId,
            offerModalLabel : offLabel


            //content: 'Passed into content api',
        }).catch(error => {
            console.log('error during modal open: ');
            console.log(error);
        });
        // if modal closed with X button, promise returns result = 'undefined'
        // if modal closed with OK button, promise returns result = 'okay'
        console.log(result);
        this.editOffer = null;
        //this.loadAccount();

    }

    async handleViewOffer(e){

        
        const result = await ViewOffersModal.open({
            // `label` is not included here in this example.
            // it is set on lightning-modal-header instead
            size: 'large',
            description: 'Accessible description of modal\'s purpose',
            pubKey : window.localStorage.getItem('pub-key'),

            //content: 'Passed into content api',
        }).catch(error => {
            console.log('error during modal open: ');
            console.log(error);
        });
        // if modal closed with X button, promise returns result = 'undefined'
        // if modal closed with OK button, promise returns result = 'okay'
        console.log(result);
        
        if(result === 'close'){

        }
        else if(result.indexOf('edit') !== -1){

            console.log('setting edit offer');
            this.editOffer = JSON.parse(result);
            console.log('edit offer set');
            console.log(JSON.stringify(this.editOffer));
            console.log(this.editOffer.edit.buying);
            
            this.baseAssetCode = this.editOffer.edit.buying;
            console.log('base asset code set');
            this.counterAssetCode = this.editOffer.edit.selling;
            console.log('assets set');
            let tempEvt = {};
            let tempTgt = {'value' : this.baseAssetCode};
            tempEvt.target = tempTgt;
            this.handleBaseAssetChange(tempEvt);

            this.handleMakeOffer(null);



            
        }

    }

    async handleViewTrades(e){

        const result = await ViewTradeHistModal.open({
            // `label` is not included here in this example.
            // it is set on lightning-modal-header instead
            size: 'large',
            description: 'Accessible description of modal\'s purpose',
            pubKey : window.localStorage.getItem('pub-key'),

            //content: 'Passed into content api',
        }).catch(error => {
            console.log('error during modal open: ');
            console.log(error);
        });
        // if modal closed with X button, promise returns result = 'undefined'
        // if modal closed with OK button, promise returns result = 'okay'
        console.log(result);
        
        

    }



}