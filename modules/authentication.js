var Authentication = function(api){
    var me = {};
    const fs = require('fs');
    var config = require("../config.js");
    var datastore = require("./common/datastore.js");

    me.process = function(apiRequest,next){
        switch (apiRequest.module) {
            case "login":
                var u = apiRequest.queryParams.u;
                var p = apiRequest.queryParams.p;
                
                //var user = datastore.getSingleQueryResult("select * from users where login='"+u+"' and password='"+p+"'");
                datastore.getUser(u,p,function(user){
                    var result = {
                        userId: user?user.id:0,
                        userName: user?user.name:"",
                        userRole: user?user.role.toLowerCase():"",
                    };
                    next(result);
                });


                break;
            case "user":
                next({languages: "gr,es,benl,de,en,befr,fr,it,lufr,nl,no,se,pt",
                    sessionId: "161227c7-3a85-424b-a73e-d8cc8c5b6f25",
                    userId: 1,
                    userName: "demo",
                    userRole: "system admin",
                });
                break;
            default:
                next("Unhandled action","nok");
        }
        
    };
    
    return me;
}();

module.exports = Authentication;

var api = module.parent.exports;
api.registerModule("user",Authentication);
api.registerModule("login",Authentication);