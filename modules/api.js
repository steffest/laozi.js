var API = function(){

    var version = "0.3 beta";
    var me = {};
    var modules = {};

    const url = require('url');
    var config = require("../config.js");
    var qs = require('querystring');

    var apiPlatform = "Node.js " + process.version;
    if (process.env.IISNODE_VERSION) apiPlatform +=  "IISnode v" + process.env.IISNODE_VERSION;
    apiPlatform += " on " + process.platform;

    me.process = function(req,next){

        var reqUrl = req.url;

        // handle IIS 403 and 404 errors when running on IISNODE
        var p = reqUrl.indexOf("?404;");
        var p2 = reqUrl.indexOf("?403;");
        if (p>=0 || p2>=0){
			p = p||p2;
			reqUrl = reqUrl.substr(p+5);
			
			p = reqUrl.indexOf("://");
			if (p>=0){
				reqUrl = reqUrl.substr(p+8);
				p = reqUrl.indexOf("/");
				if (p>=0) reqUrl = reqUrl.substr(p+1);
			}	
		}
		
		if (reqUrl.indexOf("/api/")===0) reqUrl = reqUrl.substr(4);
        var fullReqUrl = reqUrl;
        decodeURIComponent(fullReqUrl);


        reqUrl = reqUrl.split("?")[0];
        reqUrl = reqUrl.split(":")[0];
        reqUrl = reqUrl.split("..").join("");
        reqUrl = reqUrl.split("//").join("/");
        reqUrl = decodeURIComponent(reqUrl);
        var parts = reqUrl.split("/");
        var module = parts.shift();
        module = parts.shift();

        var profile = parts[0];
        var partIndex = 1;
        var method = parts[partIndex];
        var language;
        var recordId;
        
        if (config.multiLanguage && config.languages){
            if (config.languages.indexOf(method)>=0){
                language = method;
                partIndex++;
                method = parts[partIndex];
            }
        }

        var id = parseInt(method);
        if (!isNaN(id)) {
            partIndex++;
            method = parts[partIndex];
            if (!method) method="detail";
            recordId = id;
        }
        if (!method) method = "list";

        var apiRequest = {
            module: module,
            language: language,
            action: method,
            profile: profile,
            id: recordId,
            path: parts,
            queryParams: url.parse(fullReqUrl,true).query,
            host : req.headers.host
        };
        
        var handler = modules[module];
        var apiResult = {
            description: "Steffest Instasnt API",
            platform: apiPlatform,
            version: version,
            url: reqUrl,
            fullReqUrl: fullReqUrl,
            method: method,
            handler: typeof handler,
            request: apiRequest
        };

        //console.log(reqUrl);

        if (handler && handler.process){

            var process = function(){
                handler.process(apiRequest,function(result,status,cookies){
                    apiResult.status = status || "ok";
                    apiResult.result = result;
                    next(apiResult);
                });
            };

            if (req.method === "POST"){

                var contentType = req.headers["content-type"] || "";


               if (contentType.indexOf("multipart/form-data")>=0){
                   var multiparty = require('multiparty');
                   var form = new multiparty.Form();
                   form.parse(req, function(err, fields, files) {
                       apiRequest.form = fields;
                       apiRequest.files = files;
                       process();
                   });

               }else if (contentType.indexOf("www-form-urlencoded")>=0){
                   var body = '';
                   req.on('data', function (data) {
                       body += data;

                       // 1e8 === 1 * Math.pow(10, 7) === 1 * 100000000 ~~~ 100MB
                       if (body.length > 1e8) req.connection.destroy();
                   });

                   req.on('end', function () {
                       apiRequest.form = qs.parse(body);
                       process();
                   });
               } else {
                   // should we handle raw binary?
                   apiRequest.form = {};
               }
            }else{
                process();
            }

        }else{
            apiResult.result = "unknown API method";
            apiResult.status = "nok";
            next(apiResult);
        }
    };

    me.registerModule = function(name,module){
        console.log("registering " + name);
        modules[name] = module;
    };

    return me;

}();
module.exports = API;

require('./file.js');
require('./data.js');
require('./image.js');
require('./authentication.js');
require('./template.js');
require('./annotation.js');

// custom modules


