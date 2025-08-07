import { LightningElement, wire, track, api } from 'lwc';
import LightningAlert from 'lightning/alert';
import SendAssetModal from 'c/stroopForceSendAssetsModalCmp';
import SwapAssetModal from 'c/stroopForceSwapAssetsModalCmp';
import { loadStyle, loadScript } from "lightning/platformResourceLoader";
import stellar1 from '@salesforce/resourceUrl/StellarSDK';
//import { Horizon } from 'stellar-sdk';

export default class StroopForceAssetsCmp extends LightningElement {

    @track columns;
    @track data;
    server;
    


    connectedCallback(){

        this.columns = [
            { label: 'Asset', fieldName: 'asset',
               // cellAttributes: { 
                //    class: "slds-theme_shade slds-theme_success", // Apply SLDS classes for background styling
                 // }
             },
            { label: 'Balance', fieldName: 'balance', type: 'number', typeAttributes: { maximumFractionDigits: '7' } },
            { label: 'Value', fieldName: 'value', type: 'number', typeAttributes: { maximumFractionDigits: '7' } },
            {
                type: 'action',
                typeAttributes: {
                    rowActions: [
                        { label: 'Send', name: 'send_assets' },
                        { label: 'Swap', name: 'swap_assets' },
                    ],
                    menuAlignment: 'auto', // Align the menu to the right
                },
            }
            /*{
                type: 'button',
                typeAttributes: {
                    label: 'Send',
                    name: 'send_assets',
                    title: 'Click to Send Asset',
                    variant: 'brand'
                }
            },
            {
                type: 'button',
                typeAttributes: {
                    label: 'Swap',
                    name: 'swap_assets',
                    title: 'Click to Swap Asset',
                    variant: 'desctructive'
                }
            }*/
        ];

        if(window.localStorage.getItem('pub-key') && window.localStorage.getItem('pk')){

            this.loadServer();

        }

    }

    async loadServer(){

        try{
            loadScript(this, stellar1).then(() => {
                
                console.log('stellar sdk script loaded');
                //console.log(Horizon);
                console.log(StellarSdk);
                this.server = new StellarSdk.Horizon.Server('https://horizon.stellar.org');

                console.log(this.server);

                this.loadAccount();
                //var acc =  await this.server.loadAccount(window.localStorage.getItem('pub-key'));


                
              });
        
        }
        catch(e){
            console.log('error');
            console.log(e);
        }

    }

    async loadAccount(){

        let acc = await this.server.loadAccount(window.localStorage.getItem('pub-key'));
        console.log('account');
        console.log(JSON.stringify(acc));

        console.log(acc.id)

        let bal = acc.balances;

        console.log(bal);

        let tmpDataArr = [];

        for(let i = 0; i < bal.length; i++){

            console.log('asset code: ' +  bal[i].asset_code);
            console.log('asset type: ' +  bal[i].asset_type);
            console.log('asset balance: ' +  bal[i].balance);

            let assetCode = bal[i].asset_type === 'native' ? 'XLM' : bal[i].asset_code;
            let assetIss = bal[i].asset_type === 'native' ? '' : '-' + bal[i].asset_issuer;
            let assetIssBalCombo = bal[i].asset_type === 'native' ? assetCode + '-'  + bal[i].asset_type : assetCode  + assetIss;
            console.log('asset issuer balance combo: ' + assetIssBalCombo);
            let tmpRow = {
                'asset' : assetCode + assetIss,
                'assetCode' : assetCode,
                'balance' : bal[i].balance,
                'value' : '',
                'issuer' : bal[i].asset_issuer,
                'assetBalanceCombo' : assetIssBalCombo
            }

            tmpDataArr.push(tmpRow);
            

            


        }

        this.data = tmpDataArr;
        window.localStorage.setItem('asset-balances', JSON.stringify(tmpDataArr));
        let assetArr = JSON.parse(window.localStorage.getItem('asset-balances'));
        console.log(assetArr[0].asset);

    }

    handleRowAction(event) {
        const actionName = event.target.label;//event.detail.action.name;
        const tmpAsset = event.target.value;

        console.log('action name: ' + actionName);
        console.log('tmpAsset: ' + tmpAsset);

        console.log(tmpAsset);
        //const row = event.detail.row;
        switch (actionName) {
            case 'Send':
                this.handleSendAssets(tmpAsset);
                break;
            case 'Swap':
                this.handleSwapAssetsClick(tmpAsset)
                break;

            default:
        }
    }

    async handleSendAssets(r){
        console.log(r);
        //console.log(r.key-field);

        let assetIssSplit = r.split('-');
        console.log(assetIssSplit);
        let assetIss = assetIssSplit[1] === 'native' ? null : assetIssSplit[1];

        let assetBals = JSON.parse(window.localStorage.getItem('asset-balances'));
        let tgtAssetOpts = [];
        let aBal = 0;
        for(let i = 0; i < assetBals.length; i++){

            if(assetBals[i].asset === r){
                aBal = assetBals[i].balance;
            }
 

           
        }

        const result = await SendAssetModal.open({
            // `label` is not included here in this example.
            // it is set on lightning-modal-header instead
            size: 'large',
            description: 'Asset Transfer Modal',
            assetCode :  r,
            assetBalance : parseFloat(aBal),
            assetIssuer : assetIss,
            pubKey : window.localStorage.getItem('pub-key'),
            showEdit : true,
            showReview : false
            //content: 'Passed into content api',
        });
        // if modal closed with X button, promise returns result = 'undefined'
        // if modal closed with OK button, promise returns result = 'okay'
        console.log(result);
    }

    async handleSwapAssetsClick(r){

        console.log(r);
        //console.log(r.key-field);
        let assetIssSplit = r.split('-');
        let aBal = 0;
        let assetIss = assetIssSplit[1] === 'native' ? null : assetIssSplit[1];

        let assetBals = JSON.parse(window.localStorage.getItem('asset-balances'));
        let tgtAssetOpts = [];


        tgtAssetOpts.push({
            label : 'Select an option',
            value : 'empty-select'
        });

        for(let i = 0; i < assetBals.length; i++){

            if(assetBals[i].asset === r || assetBals[i].asset === assetIssSplit[0]){
                aBal = assetBals[i].balance;
            }

            let tgtAsset = {
                label : assetBals[i].asset,
                value : assetBals[i].asset
            }

            tgtAssetOpts.push(tgtAsset);
        }

        const result = await SwapAssetModal.open({
            // `label` is not included here in this example.
            // it is set on lightning-modal-header instead
            size: 'large',
            description: 'Accessible description of modal\'s purpose',
            sourceAssetCode : r,
            sourceAssetBalance : parseFloat(aBal),
            sourceAssetIssuer : assetIss,
            pubKey : window.localStorage.getItem('pub-key'),
            showEdit : true,
            showReview : false,
            targetAssetOpts : tgtAssetOpts

            //content: 'Passed into content api',
        });
        // if modal closed with X button, promise returns result = 'undefined'
        // if modal closed with OK button, promise returns result = 'okay'
        console.log(result);
        this.loadAccount();

    }


}