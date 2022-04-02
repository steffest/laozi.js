var http = require('http');
var port = process.env.PORT || 3007;

var api = require("./modules/api.js");
const fs = require('fs');

process.env.TMPDIR = '.';

http.createServer(function (req, res) {
    var reqUrl = req.url;

    if (reqUrl === "/favicon.ico"){
        res.writeHead(200);
        res.end();
    }else{
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Request-Method', '*');
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
        res.setHeader('Access-Control-Allow-Headers', '*');
        if ( req.method === 'OPTIONS' ) {
            res.writeHead(200);
            res.end();
            return;
        }


        api.process(req,function(result){
            //console.log(result);
            if (result){
                if (result.cookies && result.cookies.length){
                    var cookie = require("./modules/common/cookie.js");
                    //result.cookies.forEach
                    //cookie.set(req,res,"test","abc");
                }

                if (result.status === "file"){
                    //console.log("serving file");
                    fs.readFile(result.result, function (err,data) {
                        if (err) {
                            res.writeHead(404);
                            res.end(JSON.stringify(err));
                            return;
                        }
                        res.writeHead(200);
                        res.end(data);
                    });
                }else{
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify(result));
                }
            }else{
                res.writeHead(404, {'Content-Type': 'text/html'});
                res.end("unkown action");
            }
        });
    }

}).listen(port);


console.log("Node version " + process.version);
if (process.env.IISNODE_VERSION) console.log("IISnode version " + process.env.IISNODE_VERSION);
console.log("Running on port " + port + " on " + process.platform);




