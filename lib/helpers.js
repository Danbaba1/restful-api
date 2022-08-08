var crypto = require('crypto');
var config = require('./config');
var https = require('https');
var querystring = require('querystring');
var path = require('path');
var fs = require('fs');

var helpers = {};


helpers.hash = function(str){
    if(typeof(str) == 'string' && str.length > 0){
        var hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
        return hash;
    }else{
        return false;
    }
};

helpers.parseJsonToObject = function(str){
    try{
        var obj = JSON.parse(str);
    }catch(e){
        return {};
    }
};

helpers.createRandomString = function(strlength){
    strlength = typeof(strlength) == 'number' && strlength > 0 ? strlength : false;
    if(strlength){
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var str = '';
        for(i = 1; i < strlength; i++){
            var randomCharacter = possibleCharacters.charAt(Math.floor() * possibleCharacters.length);
            str += randomCharacter;
        }
        return str;
    }else{
        return false;
    }
}

helpers.sendTwilioSms = function(phone,msg,callback){
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length < 1600 ? msg.trim() : false;
    if(phone && msg){
        var payload = {
            'From' : config.twilio.fromPhone,
            'To' : '+1'+phone,
            'msg' : msg
        };
         var stringPayload = querystring.stringify(payload);
         var requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'apl.twilio.com',
            'method' : 'POST',
            'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            'auth' : config.twilio.accountSid+ ':' +config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-length' : Buffer.byteLength(stringPayload)
            }
         };
         var req = https.request(requestDetails,function(res){
            var status = res.statusCode;
            if(status == 200 || status == 201){
                callback(false);
            }else{
                callback('Status code request was '+status);
            }
         });
         req.on('error',function(e){
            callback(e);
         });
         req.write(stringPayload);
         req.end();
    }else{
        callback('Given parameters were missing or invalid');
    }
};

helpers.getTemplate = function(templateName,data,callback){
     templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
     if(templateName){
        var templateDir = path.join(__dirname,'/../templates/');
        fs.readFile(templateDir+templateName+'.html','utf8',function(err,str){
            if(!err && str && str.length > 0){
                var finalStr = helpers.interpolate(str,data);
                callback(false,finalStr);
            }else{
                callback('No template could be found');
            }
        });
     }else{
        callback('A valid template name was not specified');
     }
};

helpers.addUniversalTemplate = function(str,data,callback){
    str =typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};
    helpers.getTemplate('_header',data,function(err,headString){
        if(!err && headString){
            helpers.getTemplate('_footer',data,function(err,footerString){
                if(!err && footerString){
                    var fullString = headString+str+footerString;
                    callback(false,fullString);
                }else{
                    callback('Could not find the footer template');
                }
            })
        }else{
            callback('Could not find the header template');
        }
    })
}

helpers.interpolate = function(str,data){
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};
    for(var keyName in config.templateGlobals){
        if(config.templateGlobals.hasOwnProperty(keyName)){
            data['global.'+keyName] = config.templateGlobals[keyName];
        }
    }
    for(var key in data){
        if(data.hasOwnProperty(key) && typeof(data[key]) == 'string'){
            var replace = data[key];
            var find = '{'+key+'}';
            str = str.replace(find,replace);
        }
    }
    return str;
};

helpers.getStaticAsset = function(fileName,callback){
    fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
    if(fileName){
        var publicDir = path.join(__dirname,'/../public/');
        fs.readFile(publicDir+fileName,function(err,data){
            if(!err && data){
                callback(false,data);
            }else{
                callback('No file could be found');
            }
        });
    }else{
        callback('A valid file name was not specified');
    }
};

module.exports = helpers;