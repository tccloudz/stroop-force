import { LightningElement, track, wire, api } from 'lwc';

export default class StroopForceMainCmp extends LightningElement {


    @api showSettings;
    @track showSetupMsg;
    @track showAssets;
    @track showTrade;


    connectedCallback() {

        this.showSettings = false;

        if (!window.localStorage.getItem('pub-key') || !window.localStorage.getItem('pk')) {
            this.showSetupMsg = true;
        }
        else {
            this.handleShowAssets(null);
        }

    }

    handleShowSettings(e) {
        this.showSettings = true;
        this.showSetupMsg = false;
        this.showAssets = false;
        this.showTrade = false;
    
        this.clearAllIntervals();
    }

    handleShowAssets(e) {
        this.showAssets = true;
        this.showSettings = false;
        this.showSetupMsg = false;
        this.showTrade = false;

        this.clearAllIntervals();

    }

    handleShowTrade(e) {
        this.showSettings = false;
        this.showSetupMsg = false;
        this.showAssets = false;
        this.showTrade = true;

        this.clearAllIntervals();  
    }

    clearAllIntervals(){
        // Get a reference to the last interval + 1
        const interval_id = setInterval(function(){},  Number.MAX_SAFE_INTEGER);

        // Clear any timeout/interval up to that id
       for (let i = 1; i < interval_id; i++) {
            clearInterval(i);
        }
    }




}