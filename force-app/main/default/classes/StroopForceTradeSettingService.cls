public with sharing class StroopForceTradeSettingService {
    




    @AuraEnabled
    public static String saveSetting(String walletAddr, String emailAddr, Boolean active){
        
        String result = 'success';

        try {

            

            List<Stellar_Offer_Trade_Notification__c> setting = [SELECT Id, Active__c, Stellar_Wallet_Address__c, Email_Address__c FROM Stellar_Offer_Trade_Notification__c
                    WHERE Wallet_Address__c = :walletAddr limit 1];
            
            if(!active && !setting.isEmpty()){
                delete setting;
            }
            else if(active && !setting.isEmpty()){
                setting[0].Stellar_Wallet_Address__c = walletAddr;
                setting[0].Wallet_Address__c = walletAddr;
                setting[0].Active__c = true;
                setting[0].Email_Address__c = emailAddr;

                update setting[0];
            }
            else if(active && setting.isEmpty()){
                Stellar_Offer_Trade_Notification__c newSetting = new Stellar_Offer_Trade_Notification__c(
                    Stellar_Wallet_Address__c = walletAddr,
                    Wallet_Address__c = walletAddr,
                    Active__c = true,
                    Email_Address__c = emailAddr
                ); 
                
                insert newSetting;

            }


            return result;



            
        } catch (Exception e) {
            result = e.getMessage();
            
           // throw new AuraHandledException(e.getMessage());

            return result;
        }
    }

    @AuraEnabled
    public static String saveDEXOffer(String offerId, String ba, String sa, String oa, String op, String walletAddr, String spreadDevPer){
        
        String result = 'success';

        try {

            System.debug('wallet addr: ' + walletAddr);

            List<Stellar_Offer_Trade_Notification__c> tradeSetting = [SELECT Id FROM Stellar_Offer_Trade_Notification__c 
                WHERE Wallet_Address__c = :walletAddr];
            
            System.debug('Trade setting size: ' + tradeSetting.size());

            Decimal spreadDevPerVal = spreadDevPer == null || spreadDevPer == 'null' ? null : Decimal.valueOf(spreadDevPer);

            if(!tradeSetting.isEmpty()){

                Stellar_DEX_Offer__c dexOffer = new Stellar_DEX_Offer__c(
                    Buying_Asset__c = ba,
                    Selling_Asset__c = sa,
                    Offer_Amount__c = Decimal.valueOf(oa),
                    Name = offerId,
                    Offer_ID__c = offerId,
                    Offer_Price__c = Decimal.valueOf(op),
                    Stellar_Offer_Trade_Notification__c = tradeSetting[0].Id,
                    Percentage_Away_from_Spread_Threshold__c = spreadDevPerVal
  
                );

                upsert dexOffer Offer_ID__c;

                return result;

            }
            else{
                result = 'No trade notification setting set-up. Go to settings and toggle the Trade Notification off and on again';
                return result;
            }


                


            
        } catch (Exception e) {
            result = e.getMessage();

            return result;
        }
    }

    @AuraEnabled
    public static String deleteDEXOffer(String offerId){

        String result = 'success';

        try {
            
            List<Stellar_DEX_Offer__c> delOffer = [SELECT Id FROM Stellar_DEX_Offer__c WHERE Offer_ID__c = :offerId];
            delete delOffer;


            return result;

        } catch (Exception e) {
            result = e.getMessage();
            return result;
        }
    }

    @AuraEnabled
    public static String initTradeNotificationScheduler(String walletAddr){

        String result = 'success';
        try {

            StroopForceTradeNotitifcationScheduler ts = new StroopForceTradeNotitifcationScheduler(walletAddr);
            Datetime currDT = Datetime.now();
            Integer min = currDT.addMinutes(5).minute();
            String newCronExp = '0 ' + min + ' * * * ?';
            
            System.schedule(walletAddr + ' DEX Trade Notify', newCronExp, ts);


            return result;
            
        } catch (Exception e) {
            result = e.getMessage();

            return result;
        }
    }

    @AuraEnabled
    public static String deleteTradeNotificationScheduler(String walletAddr){

        String result = 'success';
        try {

            String jobName = walletAddr + ' DEX Trade Notify';
            List<CronTrigger> jobs = [SELECT Id, CronJobDetail.Id, CronJobDetail.Name, CronJobDetail.JobType FROM CronTrigger 
                        WHERE CronJobDetail.Name =: jobName];

            
            for(CronTrigger job : jobs){
                System.abortJob(job.Id);
            }


            return result;
            
        } catch (Exception e) {
            result = e.getMessage();

            return result;
        }
    }



}