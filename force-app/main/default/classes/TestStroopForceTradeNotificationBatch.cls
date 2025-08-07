@isTest
private class TestStroopForceTradeNotificationBatch {
    


    @testSetup static void setupTestRecords() {
        
        String res = StroopForceTradeSettingService.saveSetting('TESTWALLETADDR', 'TESTEMAILADDR@TESTEMAILADDRSTROOPFORCE.COM', true);

        List<Stellar_Offer_Trade_Notification__c> setting = [SELECT Id, Active__c, Stellar_Wallet_Address__c, Email_Address__c FROM Stellar_Offer_Trade_Notification__c
                    WHERE Wallet_Address__c = 'TESTWALLETADDR' AND Active__c = TRUE AND Email_Address__c = 'TESTEMAILADDR@TESTEMAILADDRSTROOPFORCE.COM' limit 1];


        System.assertEquals(1, setting.size(), 'Setting was not saved successfully');
        System.assertEquals('success', res, 'Results did not return as success');

        res = StroopForceTradeSettingService.saveDEXOffer('123456789', 'TESTBUY-ABC123', 'TESTSELL-123ABC', '1', '1', 'TESTWALLETADDR', 'null');

        List<Stellar_DEX_Offer__c> dexOffers = [SELECT Id FROM Stellar_DEX_Offer__c WHERE Offer_ID__c = '123456789' AND Stellar_Offer_Trade_Notification__r.Wallet_Address__c = 'TESTWALLETADDR'];

        System.assertEquals(1, dexOffers.size(), 'DEX offer was not created after method call');
        System.assertEquals('success', res, 'Success result was not returned');

        res = StroopForceTradeSettingService.saveDEXOffer('987654321', 'TESTBUY-ABC123', 'TESTSELL-123ABC', '1', '1', 'TESTWALLETADDR', 'null');

        dexOffers = [SELECT Id FROM Stellar_DEX_Offer__c WHERE Offer_ID__c = '987654321' AND Stellar_Offer_Trade_Notification__r.Wallet_Address__c = 'TESTWALLETADDR'];

        System.assertEquals(1, dexOffers.size(), 'DEX offer was not created after method call');
        System.assertEquals('success', res, 'Success result was not returned');
    }


    @isTest
    private static void testScheduler(){

        Test.startTest();

        //List<String> offIds = new List<String>{'123456789'};

        Test.setMock(HttpCalloutMock.class, new TestStroopForceMockService('GET_OFFERS', '123456789'));

        String query = 'SELECT Id,Buying_Asset__c,Selling_Asset__c,Offer_Amount__c,Name,Offer_ID__c,Offer_Price__c,Stellar_Offer_Trade_Notification__c,Stellar_Offer_Trade_Notification__r.Email_Address__c FROM Stellar_DEX_Offer__c'
                    + ' WHERE Stellar_Offer_Trade_Notification__r.Wallet_Address__c = ' + '\'' + 'TESTWALLETADDR' + '\'' + ' AND  Stellar_Offer_Trade_Notification__r.Active__c = TRUE AND Status__c <> ' + '\'' + 'Filled' + '\'';

        StroopForceOfferFillFetch_Batch bat = new StroopForceOfferFillFetch_Batch(query, 'TESTWALLETADDR');

        Database.executeBatch(bat, 2);
        Test.stopTest();

        List<Stellar_DEX_Offer__c> dexOffers = [SELECT Id FROM Stellar_DEX_Offer__c WHERE Status__c = 'Filled' AND Offer_ID__c = '987654321' AND Stellar_Offer_Trade_Notification__r.Wallet_Address__c = 'TESTWALLETADDR'];

        System.assertEquals(1, dexOffers.size(), 'Offer fill batch did not update filled dex offer status to Filled');

    }
}