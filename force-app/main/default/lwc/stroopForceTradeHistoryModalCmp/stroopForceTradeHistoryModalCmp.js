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


export default class StroopForceTradeHistoryModalCmp extends LightningModal {



    @api pubKey;
    @track tradeData;
    server;

    async connectedCallback(){

        await this.loadServer();

        if(this.server){
            this.getTrades();
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

    async getTrades(){
        if(!this.server){


        }
        else{

            try {
                const trades = await this.server.trades()
                  .forAccount(this.pubKey)
                  .limit(200)
                  .order('desc')
                  .call();
            
                console.log('Trades for account:', this.pubKey);
                this.tradeData = [];
                trades.records.forEach(trade => {
                  console.log(JSON.stringify(trade));

                   let baseCode = trade.base_asset_type === 'native' ? 'XLM' : trade.base_asset_code + '-' + trade.base_asset_issuer;
                   let counterCode = trade.counter_asset_type === 'native' ? 'XLM' : trade.counter_asset_code + '-' + trade.counter_asset_issuer;

                   let sellingCode = trade.base_is_seller === true ? baseCode: counterCode;
                   let buyingCode = trade.base_is_seller === true ? counterCode : baseCode;
                   let sellingAmount = trade.base_is_seller === true ? trade.base_amount : trade.counter_amount;
                   let buyingAmount =  trade.base_is_seller === true ? trade.counter_amount : trade.base_amount;
                   let price = trade.base_is_seller === true ? (parseFloat(trade.base_amount) / parseFloat(trade.counter_amount)).toFixed(7) + ' (' + trade.base_asset_code + ')'
                                :  (parseFloat(trade.counter_amount) / parseFloat(trade.base_amount)).toFixed(7) + ' (' + trade.counter_asset_code + ')';

                   let trRec = {
                     hashId : trade.id,
                     selling : sellingCode,
                     buying : buyingCode,
                     sellingAmount : sellingAmount,
                     buyingAmount : buyingAmount,
                     price : price,
                     tradeTime : (new Date(trade.ledger_close_time)).toLocaleString()

                   };

                   this.tradeData.push(trRec);


                });
            
                // Example of using pagination (fetching the next page of results)
                /*if (trades.records.length > 0) {
                    const nextPage = await trades.next();
                    console.log("Next page of trades:", nextPage.records)
                }*/
            
            
              } catch (error) {
                console.error('Error fetching trades:', error);
              }
            }
        }

    handleClose(e){
        this.close('close');
    }
}

    


