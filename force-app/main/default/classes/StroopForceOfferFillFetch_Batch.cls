public with sharing class StroopForceOfferFillFetch_Batch implements Database.Batchable<sObject>, Database.Stateful, Database.AllowsCallouts{
    
    
    public String query;
    public String walletAddr;
    public List<Stellar_DEX_Offer__c> filledOffers;
    

    public StroopForceOfferFillFetch_Batch(String q, String wa) {

        query = q;
        walletAddr = wa;
        filledOffers = new List<Stellar_DEX_Offer__c>();

    }

    public Database.QueryLocator start(Database.BatchableContext bc){
        return Database.getQueryLocator(query);
     }
  
     public void execute(Database.BatchableContext bc, List<sObject> scope){
        
        String endPt = 'https://horizon.stellar.org/accounts/' + walletAddr + '/offers';
        Http h = new Http();
        HttpRequest req = new HttpRequest();
        HttpResponse resp; 
        List<Stellar_DEX_Offer__c> updDexOffs = new List<Stellar_DEX_Offer__c>();

        req.setMethod('GET');
        req.setEndpoint(endPt);
        req.setHeader('Accept', 'application/json');

        try{
            resp = h.send(req);

            if(resp.getStatusCode() != 200){

            }
            else{
                JSONParser parser = JSON.createParser(resp.getBody());
                Set<String> activeOfferIds = new Set<String>();

                while(parser.nextToken() != null){

                    if (parser.getCurrentToken() == JSONToken.FIELD_NAME && parser.getText() == 'id') {

                        parser.nextToken();
                        activeOfferIds.add(parser.getText());

                    }

                }


                for(Stellar_DEX_Offer__c dexOff : (List<Stellar_DEX_Offer__c>) scope){

                    if(!activeOfferIds.contains(dexOff.Offer_ID__c)){
                        filledOffers.add(dexOff);
                        dexOff.Status__c = 'Filled';
                        updDexOffs.add(dexOff);
                    }

                }

                update updDexOffs;

            }

        }catch(Exception ex){
            System.debug(LoggingLevel.ERROR, ex.getMessage());
        }

     }
  
     public void finish(Database.BatchableContext bc){

        Messaging.SingleEmailMessage sem = new  Messaging.SingleEmailMessage();
        String subj = 'DEX Offers filled for ' + walletAddr; 
        String emBody = '';
        String toAddr;

        for(Stellar_DEX_Offer__c dexOff : filledOffers){

            emBody += 'Offer ID: ' + dexOff.Offer_ID__c + '\n'
                    + 'Sold: ' + dexOff.Selling_Asset__c + '\n'
                    + 'Bought: ' + dexOff.Buying_Asset__c + '\n'
                    + 'Offer Amount: ' + dexOff.Offer_Amount__c + '\n'
                    + 'Offer Price: ' + dexOff.Offer_Price__c + '\n\n';

            toAddr = dexOff.Stellar_Offer_Trade_Notification__r.Email_Address__c;

        }

        sem.subject = subj;
        sem.plainTextBody = emBody;
        sem.toAddresses = new List<String>{toAddr};

        try{
            
            Object retVal = toAddr != null ? Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{sem}) : null;
        }catch(Exception ex){
            System.debug(LoggingLevel.ERROR, ex.getMessage());
        }

     }
}