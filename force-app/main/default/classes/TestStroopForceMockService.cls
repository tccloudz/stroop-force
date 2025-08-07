public with sharing class TestStroopForceMockService implements HttpCalloutMock{
    
    public String respType;
    public String offerId;

    public TestStroopForceMockService(String rt, String offId){
        respType = rt;
        offerId = offId;

    }

    public HttpResponse respond(HttpRequest req){

        HttpResponse resp = new HttpResponse();
        String respBody = '';
        switch on respType {
            when  'GET_OFFERS'{
                respBody += '{';
                resp.setStatusCode(200);
      
                respBody += '"id" : ' + '"' + offerId + '"}';

                System.debug(LoggingLevel.INFO, respBody);

                //respBody = respBody.left(respBody.length() - 1);
                //respBody += '}';
                resp.setBody(respBody);
                return resp;
            }
            when else {
                return resp;
            }
        }

    }
}