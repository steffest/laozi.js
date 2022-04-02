var Template = function(){
    var me = {};
    const filesystem = require("./common/filesystem.js");
    const dataStore = require("./common/datastore.js");
    const path = require("path");

    me.process = function(apiRequest,next){

        var action = "get";
        var startPathIndex = 0;
        var method = apiRequest.path[startPathIndex];
        if (method === "get"){
            startPathIndex++;
            method = apiRequest.path[startPathIndex];
        }

        var filePath = filesystem.getPathFromIndex(apiRequest.path,startPathIndex);
        var fullFileName = path.join(dataStore.getDataStorePath(),"templates/admin/",filePath + ".html");

        filesystem.readText(fullFileName,next);

    };

    return me;
}();

module.exports = Template;

var api = module.parent.exports;
api.registerModule("template",Template);