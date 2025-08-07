@isTest
private class TestStroopForceTradeSettingService {


    @isTest
    private static void testSaveSetting(){

        Test.startTest();

        //Test setting creation

        String res = StroopForceTradeSettingService.saveSetting('TESTWALLETADDR', 'TESTEMAILADDR@TESTEMAILADDRSTROOPFORCE.COM', true);

        List<Stellar_Offer_Trade_Notification__c> setting = [SELECT Id, Active__c, Stellar_Wallet_Address__c, Email_Address__c FROM Stellar_Offer_Trade_Notification__c
                    WHERE Wallet_Address__c = 'TESTWALLETADDR' AND Active__c = TRUE AND Email_Address__c = 'TESTEMAILADDR@TESTEMAILADDRSTROOPFORCE.COM' limit 1];


        System.assertEquals(1, setting.size(), 'Setting was not saved successfully');
        System.assertEquals('success', res, 'Results did not return as success');


        //Test update

        res = StroopForceTradeSettingService.saveSetting('TESTWALLETADDR', 'TESTEMAILADDR@TESTEMAILADDRSTROOPFORCE.COM', true);
         setting = [SELECT Id, Active__c, Stellar_Wallet_Address__c, Email_Address__c FROM Stellar_Offer_Trade_Notification__c
                    WHERE Wallet_Address__c = 'TESTWALLETADDR' AND Active__c = TRUE AND Email_Address__c = 'TESTEMAILADDR@TESTEMAILADDRSTROOPFORCE.COM'];


        System.assertEquals(1, setting.size(), 'Method call created new record instead of updating existing record');
        System.assertEquals('success', res, 'Results did not return as success for record update');
        
        //Test setting removal

        res = StroopForceTradeSettingService.saveSetting('TESTWALLETADDR', 'TESTEMAILADDR@TESTEMAILADDRSTROOPFORCE.COM', false);

        setting = [SELECT Id, Active__c, Stellar_Wallet_Address__c, Email_Address__c FROM Stellar_Offer_Trade_Notification__c
                    WHERE Wallet_Address__c = 'TESTWALLETADDR'];

        System.assertEquals(0, setting.size(), 'Setting was not removed successfully');
        System.assertEquals('success', res, 'Results did not return as success when removing setting record');


        //Test exception handling
        res = StroopForceTradeSettingService.saveSetting('TESTWALLETADDRFAILCASE', 'TESTEMAILADDRFAILCASE', true);

        setting = [SELECT Id, Active__c, Stellar_Wallet_Address__c, Email_Address__c FROM Stellar_Offer_Trade_Notification__c
                    WHERE Wallet_Address__c = 'TESTWALLETADDRFAILCASE'];


        System.assertEquals(0, setting.size(), 'Exception case should not have resulted in a saved record');
        System.assertEquals(true, res != 'success', 'Exception case should not have retruned a success result');
        

        Test.stopTest();

    }

    @isTest
    private static void testSaveDexOffer(){

        String res = StroopForceTradeSettingService.saveSetting('TESTWALLETADDR', 'TESTEMAILADDR@TESTEMAILADDRSTROOPFORCE.COM', true);

        List<Stellar_Offer_Trade_Notification__c> setting = [SELECT Id, Active__c, Stellar_Wallet_Address__c, Email_Address__c FROM Stellar_Offer_Trade_Notification__c
                    WHERE Wallet_Address__c = 'TESTWALLETADDR' AND Active__c = TRUE AND Email_Address__c = 'TESTEMAILADDR@TESTEMAILADDRSTROOPFORCE.COM' limit 1];


        System.assertEquals(1, setting.size(), 'Setting was not saved successfully');
        System.assertEquals('success', res, 'Results did not return as success');

        Test.startTest();


        //Test standard dex offer save
        res = StroopForceTradeSettingService.saveDEXOffer('123456789', 'TESTBUY-ABC123', 'TESTSELL-123ABC', '1', '1', 'TESTWALLETADDR', 'null');

        List<Stellar_DEX_Offer__c> dexOffers = [SELECT Id FROM Stellar_DEX_Offer__c WHERE Offer_ID__c = '123456789' AND Stellar_Offer_Trade_Notification__r.Wallet_Address__c = 'TESTWALLETADDR'];

        System.assertEquals(1, dexOffers.size(), 'DEX offer was not created after method call');
        System.assertEquals('success', res, 'Success result was not returned');

        
        //Test exception handling

        res = StroopForceTradeSettingService.saveDEXOffer('987654321', 'TESTBUY-ABC123', 'TESTSELL-123ABC', '1', 'NaN', 'TESTWALLETADDR', 'null');

        dexOffers = [SELECT Id FROM Stellar_DEX_Offer__c WHERE Offer_ID__c = '987654321' AND Stellar_Offer_Trade_Notification__r.Wallet_Address__c = 'TESTWALLETADDR'];

        System.assertEquals(0, dexOffers.size(), 'DEX offer should not have been created due to exception');
        System.assertEquals(true, res != 'success', 'Success result should not have been returned');



        //Test delete
        res = StroopForceTradeSettingService.deleteDEXOffer('123456789');
        System.assertEquals(0, dexOffers.size(), 'DEX offer was not deleted');
        System.assertEquals('success', res, 'Success result was not returned');

        
        //test save without trade notification setting.
        res = StroopForceTradeSettingService.saveSetting('TESTWALLETADDR', 'TESTEMAILADDR@TESTEMAILADDRSTROOPFORCE.COM', false);

        setting = [SELECT Id, Active__c, Stellar_Wallet_Address__c, Email_Address__c FROM Stellar_Offer_Trade_Notification__c
                    WHERE Wallet_Address__c = 'TESTWALLETADDR'];

        System.assertEquals(0, setting.size(), 'Setting was not removed successfully');
        System.assertEquals('success', res, 'Results did not return as success when removing setting record');

        res = StroopForceTradeSettingService.saveDEXOffer('123456789', 'TESTBUY-ABC123', 'TESTSELL-123ABC', '1', '1', 'TESTWALLETADDR', 'null');

        dexOffers = [SELECT Id FROM Stellar_DEX_Offer__c WHERE Offer_ID__c = '123456789' AND Stellar_Offer_Trade_Notification__r.Wallet_Address__c = 'TESTWALLETADDR'];

        System.assertEquals(0, dexOffers.size(), 'DEX offer should not have created if no trade setting was found');
        System.assertEquals(true, res.contains('No trade notification setting set-up'), 'No trade setting warning was not returned');


        Test.stopTest();
    }

    @isTest
    private static void testScheduler(){

        Test.startTest();

        String res1 = StroopForceTradeSettingService.initTradeNotificationScheduler('TESTWALLETADDR');

       

        Test.stopTest();

        String jobName =  'TESTWALLETADDR DEX Trade Notify';
        List<CronTrigger> jobs = [SELECT Id, CronJobDetail.Id, CronJobDetail.Name, CronJobDetail.JobType FROM CronTrigger 
                        WHERE CronJobDetail.Name =: jobName];
        System.assertEquals(1, jobs.size(), 'Job was not scheduled successfully');
        System.assertEquals('success', res1, 'Success result was not returned for happy path');

        res1 = StroopForceTradeSettingService.deleteTradeNotificationScheduler('TESTWALLETADDR');
        jobs = [SELECT Id, CronJobDetail.Id, CronJobDetail.Name, CronJobDetail.JobType FROM CronTrigger 
                        WHERE CronJobDetail.Name =: jobName];
        System.assertEquals(0, jobs.size(), 'Job was not deleted successfully');
        System.assertEquals('success', res1, 'Success result was not returned for delete path');



     
    }
    
}