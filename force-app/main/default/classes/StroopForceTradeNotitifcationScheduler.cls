public with sharing class StroopForceTradeNotitifcationScheduler implements Schedulable{
    
    
    public String walletAddress;
    

    public StroopForceTradeNotitifcationScheduler(String walletAddr){
        walletAddress = walletAddr;

    }

    public void execute(SchedulableContext sc) {

        String query = 'SELECT Id,Buying_Asset__c,Selling_Asset__c,Offer_Amount__c,Name,Offer_ID__c,Offer_Price__c,Stellar_Offer_Trade_Notification__c,Stellar_Offer_Trade_Notification__r.Email_Address__c FROM Stellar_DEX_Offer__c'
                    + ' WHERE Stellar_Offer_Trade_Notification__r.Wallet_Address__c = ' + '\'' + walletAddress + '\'' + ' AND  Stellar_Offer_Trade_Notification__r.Active__c = TRUE AND Status__c <> ' + '\'' + 'Filled' + '\'';
      
        

        StroopForceOfferFillFetch_Batch bat = new StroopForceOfferFillFetch_Batch(query, walletAddress);

        String jobId = Database.executeBatch(bat);

        Datetime currDT = Datetime.now();
        Integer min = currDT.addMinutes(5).minute();
        String newCronExp = '0 ' + min + ' * * * ?';

        System.abortJob(sc.getTriggerId());

        StroopForceTradeNotitifcationScheduler ts = new StroopForceTradeNotitifcationScheduler(walletAddress);

        System.schedule(walletAddress + ' DEX Trade Notify', newCronExp, ts);
    }
}