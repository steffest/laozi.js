var Data = function(api){
    var me = {};
    const fs = require('fs');
    const path = require('path');
    var config = require("../config.js");
    var datastore = require("./common/datastore.js");

    me.process = function(apiRequest,next){
        
        var paramIndex = 2;
        if (apiRequest.language) paramIndex++;

        var doProcess = true;
        if (apiRequest.profile.indexOf("db_")>=0){
            doProcess = false;
            if (next) next("not implemented");
        }

        if (doProcess){
            var filter;
            if (apiRequest.action === "category"){
                filter = [];
                var category = apiRequest.path[paramIndex];
                if (typeof category === "string") category = category.toLowerCase();
                filter.push({key: "category", value: category});
                apiRequest.action = "list";
            }

            switch (apiRequest.action) {
                case "detail":
                    datastore.getById(apiRequest.profile,apiRequest.id,apiRequest.language,next);
                    break;
                case "structure":
                    datastore.getStructure(apiRequest.profile,next);
                    break;
                case "select":
                case "list":
                    datastore.listProfile(apiRequest.profile,apiRequest.language,next,filter);
                    break;
                case "update":
                    datastore.update(apiRequest.profile,apiRequest.id,apiRequest.form,next);
                    break;
                default:
                    if (next) next(apiRequest);
            }
        }
    };

    return me;
}();

module.exports = Data;

var api = module.parent.exports;
api.registerModule("data",Data);