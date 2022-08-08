var app = {};

app.config = {
    'sessionToken' : false
};

app.client = {};

app.client.request = function(headers,path,method,queryStringObject,payload,callback){
    headers = typeof(headers) == 'object' && headers !== null ? headers : {};
    path = typeof(path) == 'string' ? path : '/';
    method = typeof(method) == 'string' && ['POST','GET','PUT','DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
    queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
    payload = typeof(payload) == 'object' && payload !== null ? payload : {};
    callback = typeof(callback) == 'function' ? callback : false;

    var requestUrl = path+'?';
    var counter = 0;
    for(var queryKey in queryStringObject){
        if(queryStringObject.hasOwnProperty(queryKey)){
            counter++;
            if(counter > 1){
                requestUrl+='&';
            }
            requestUrl+=queryKey+'='+queryStringObject[queryKey];
        }
    }
    var xhr = new XMLHttpRequest();
    xhr.open(method,requestUrl,true);
    xhr.setRequestHeader('Content-type','application/json');
    for(var headerKey in headers){
        if(headers.hasOwnProperty(headerKey)){
            xhr.setRequestHeader(headerKey,headers[headerKey]);
        }
    }
    if(app.config.sessionToken){
        xhr.setRequestHeader("token",app.config.sessionToken.id);
    }
    xhr.onreadystatechange = function(){
        if(xhr.readyState == XMLHttpRequest.DONE){
            var statusCode = xhr.status;
            var responseReturned = xhr.responseText;
            if(callback){
                try{
                    var parsedResponse = JSON.parse(responseReturned);
                    callback(statusCode,parsedResponse)
                }catch(e){
                    callback(statusCode,false);
                }
            }
        }
    }
    var payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
};

// Bind the forms
app.bindForms = function(){
 document.querySelector("form").addEventListener("submit", function(e){

   // Stop it from submitting
   e.preventDefault();
   var formId = this.id;
   var path = this.action;
   var method = this.method.toUpperCase();

   // Hide the error message (if it's currently shown due to a previous error)
   document.querySelector("#"+formId+" .formError").style.display = 'hidden';

   // Turn the inputs into a payload
   var payload = {};
   var elements = this.elements;
   for(var i = 0; i < elements.length; i++){
     if(elements[i].type !== 'submit'){
       var valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
       payload[elements[i].name] = valueOfElement;
     }
   }
console.log(payload);
   // Call the API
   app.client.request(undefined,path,method,undefined,payload,function(statusCode,responsePayload){
     // Display an error on the form if needed
     if(statusCode !== 200){

       // Try to get the error from the api, or set a default error message
       var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

       // Set the formError field with the error text
       document.querySelector("#"+formId+" .formError").innerHTML = error;

       // Show (unhide) the form error field on the form
       document.querySelector("#"+formId+" .formError").style.display = 'block';

     } else {
       // If successful, send to form response processor
       app.formResponseProcessor(formId,payload,responsePayload);
     }

   });
 });
};

// Form response processor
app.formResponseProcessor = function(formId,requestPayload,responsePayload){
 var functionToCall = false;
 if(formId == 'accountCreate'){
    console.log("The account create form was successfully submitted");
   // @TODO Do something here now that the account has been created successfully
 }
};

// Init (bootstrapping)
app.init = function(){
 // Bind all form submissions
 app.bindForms();
};

// Call the init processes after the window loads
window.onload = function(){
 app.init();
};