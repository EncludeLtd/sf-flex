/*
   Twilio REST Endpoint
*/

//================================================================================
// Modules
//================================================================================

var querystring = require('querystring');
var request = require('request');
const TokenValidator = require('twilio-flex-token-validator').functionValidator;

/*
 ***IMPORTANT***
 TokenValidator wrapper authenticates the user by checking for their JWT bearer token in the request
 This is what protects the endpoint from outside requests
 ***IMPORTANT***
*/
exports.handler = TokenValidator(function(context, event, callback) {
   //================================================================================
   // Event and Context Variables
   //================================================================================

   // Are we using a sandbox or not
   var isSandbox = (context.SF_IS_SANDBOX == 'true');

   //Consumer Key from Salesforce Connected app
   var clientId = context.SF_CONSUMER_KEY;

   //Consumer Secrect from Salesforce Connected app
   var clientSecret = context.SF_CONSUMER_SECRET;

   //The salesforce username;
   var sfUserName = context.SF_USERNAME;

   //The salesforce password
   var sfPassword = context.SF_PASSWORD;

   //The salesforce user token
   var sfToken = context.SF_TOKEN;

   //SF login url
   var salesforceUrl = 'https://login.salesforce.com';

   if(isSandbox === true) {
      salesforceUrl = 'https://test.salesforce.com';
   }

   var phoneNumber = event.phoneNumber;

   //================================================================================
   // Build Response
   //================================================================================
   // Set the CORS headers to allow Flex to make an HTTP request to the Twilio Function
   const response = new Twilio.Response();
   response.appendHeader('Access-Control-Allow-Origin', '*');
   response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST GET');
   response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
   response.appendHeader('Content-Type', 'application/json');

   sfAuthenticate(); // Get SF auth token to make a REST request

   //================================================================================
   // Salesforce Authentication
   //================================================================================
   function sfAuthenticate(){
      var form = {
         grant_type: 'password',
         client_id: clientId,
         client_secret: clientSecret,
         username: sfUserName,
         password:sfPassword + sfToken
      };

      var formData = querystring.stringify(form);
      var contentLength = formData.length;

      request({
         headers: {
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded'
         },
         uri: salesforceUrl +'/services/oauth2/token',
         body: formData,
         method: 'POST'
      }, function (err, res, body) {
         if(res.statusCode == 200){
            var sfAuthReponse = JSON.parse(body);
            sfLookup(phoneNumber, sfAuthReponse);
         } else{
            handleError(err, res, body);
         }
      });
   }


   //================================================================================
   // Salesforce REST Call
   //================================================================================
   function sfLookup(phoneNumber, sfAuthReponse) {
      var uri = sfAuthReponse.instance_url + '/services/apexrest/phone-lookup/' + phoneNumber;
      var headers = {
         'Authorization': 'Bearer ' + sfAuthReponse.access_token,
     };
      request({
         headers: headers,
         uri: uri,
         method: 'GET'
      }, function (err, res, body) {
         if(res.statusCode == 200){
            response.setBody(res.body);
            callback(null, response);
         } else{
            handleError(err, res, body);
         }
      });
   }

   //================================================================================
   // HTTP Error handling
   //================================================================================
   function handleError(err, res, body) {
      var statusCode = res.statusCode || 500;
      response.setStatusCode(statusCode);
      response.setBody(err || body);
      callback(null, response);
   }

});
