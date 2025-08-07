# stroop-force
A stand-alone Salesforce Lightning app that is a Stellar blockchain wallet with Stellar DEX capabilities.


<strong>This app was created as a side-project to scratch an itch. This is a work in progress and I am not sure when it will be a finished product, probably never. Use at your own risk!
<br/><br/>The Lightning app has the following capabilties (thus far): </strong>

<ul>
  <li>
    Can add an existing account by providing public address and private key. Key is encrypted and stored locally and is never stored in Salesforce object records. There are plans to adding features to generate a new account and providing a 12-word mneumoic key phrase, but not sure when that will happen.
  </li>
  <li>
    View all Stellar assets where an trustline has been establised for the account and the balance of each asset.
  </li>
  <li>
    Sending assets.
  </li>
  <li>
    Swap assets via the <a href="https://developers.stellar.org/docs/data/apis/horizon/api-reference/resources/operations/object/path-payment-strict-send">Strict Path Payment Send<a/> which will use Stellar DEX offers and classic liquidity pools. Swap amounts are re-quoted every 5 seconds with swap path displayed.
  </li>
  <li>
    View Stellar DEX orderbook of trading pairs, based on assets where a trustline has been established.
  </li>
  <li>
    Submit a DEX offer based on assets where a trustline has been established.
  </li>
  <li>
    View, edit and cancel existing DEX offers.
  </li>
  <li>
    View trade history, up to 200 transactions into the past.
  </li>
   <li>
     Experimental:
     <ul>
       <li>
         Offer fill notification. This requires storing account public address and offer ID information into Salesforce object records. An Apex job is scheduled to run every five minutes to check if the offer has been filled and if so and email is sent out to an email address provided in settings.
       </li>
       <li>
         Email alerts when offer price is X% away from spread price. This feature has not been fully built out yet.
       </li>
     </ul>
   </li>   
</ul>

<br/><br/>
Mostly native Salesforce Lightning Web Components and Apex was used to build the app. External libraries such as <a href="https://github.com/brix/crypto-js">cryptojs</a> and of course the <a href="https://github.com/stellar/js-stellar-sdk">stellar horizon js sdk</a> was used as well and was imported in LWC  js files via <a href="https://developer.salesforce.com/docs/platform/lwc/guide/create-resources.html">Salesforce static resources</a>.

<br /> <br />
<hr />
<h3>Screenshots</h3><br/><br/>
<h4>Viewing Assets</h4>
<img width="1895" height="1015" alt="stroop-force-viewing-assets" src="https://github.com/user-attachments/assets/3d73c5dc-d9ec-4780-8903-1fc6db981a93" />

<h4>Swap Assets</h4>
<img width="1895" height="1015" alt="stroop-force-swap-assets-1" src="https://github.com/user-attachments/assets/86788da8-282c-48c5-9372-1c5591c39454" />
<img width="1895" height="1015" alt="stroop-force-swap-assets-2" src="https://github.com/user-attachments/assets/ad9f047d-dd6d-4b9b-94b7-871493ba4021" />
<img width="1895" height="1015" alt="stroop-force-swap-assets-3" src="https://github.com/user-attachments/assets/25785c33-6a32-42bb-aa94-27505226851d" />

<br/>
<h4>Viewing an offerbook of a trading pair</h4>
<img width="1895" height="1015" alt="stroop-force-view-order-book" src="https://github.com/user-attachments/assets/dfe9e490-0dfa-44e8-9e3f-2c1eaf60c79b" /><br/>
<h4>
  Making an offer
</h4>
<img width="1895" height="1015" alt="stroop-force-make-offer-1" src="https://github.com/user-attachments/assets/e23cf3ab-228e-4e56-80db-0894ef434d74" />
<img width="1895" height="1015" alt="stroop-force-make-offer-2" src="https://github.com/user-attachments/assets/b757e59f-60ce-4cbb-86f0-f30d6af38e75" />
<img width="1895" height="1015" alt="stroop-force-make-offer-3" src="https://github.com/user-attachments/assets/5386c576-0920-4425-9614-783557a8fd7e" /><br/>
<h4>Viewing active offers</h4>
<img width="1895" height="1015" alt="stroop-force-view-offers-1" src="https://github.com/user-attachments/assets/25f3e74a-c298-4785-8e89-accee89fec45" /><br/>
<h4>Viewing Trade History</h4>

<img width="1895" height="1015" alt="stroop-force-view-trades" src="https://github.com/user-attachments/assets/8758e14e-292b-4b69-b0a5-f536460faf37" /><br/>
<h4>Cancelling an offer</h4>
<img width="1889" height="1020" alt="stroop-force-cancel-offer-1" src="https://github.com/user-attachments/assets/145faa04-6d0b-4d13-b03c-2db58b84facb" />


