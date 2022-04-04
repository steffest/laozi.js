const path = require("path");

var Config = {
    dataStoreDirectory: "datastore",
    profileDirectory: "profiles",
    multiLanguage: false,
    languages: ["en","nl","benl","befr","lufr","fr","it","es","de","se","no","gr"],
    defaultLanguage : "en",
    rootPath: path.join(__dirname,"./docs")
};

Config.getHostConfig = function(host){
    var conf = Config;
    if (host){
        if (host.indexOf("test")>=0){
            conf.rootPath = "...";
        }
    }
    return conf;
};


Config.getFileBasePath = function(pathName,host){
    if (host){
        var conf = Config.getHostConfig(host);
        return path.join(conf.rootPath,pathName);
    }else{
        return path.join(Config.rootPath,pathName);
    }

};

module.exports = Config;


