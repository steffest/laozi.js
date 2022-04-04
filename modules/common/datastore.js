var DataStore = function () {
    var me = {};

    var config = require("../../config.js");
    const path = require("path");
    const fs = require("fs");
    const filesystem = require("./filesystem.js");
    const eventBus = require("./eventBus.js");

    me.getSingleQueryResult = function () {

    };

    me.getUser = function (u, p, next) {
        me.listProfile("users", function (list) {
            var user = list.find(_user => _user.login === u && _user.password === p);
            if (user) delete (user.password);
            next(user);
        })
    };


    me.listProfile = function (profile, language, next, filter, order,published) {

        if (typeof language === "function") {
            next = language;
            language = undefined;
        }

        var list = [];
        var pathName = me.getProfilePath(profile, language);

        //console.error(filter);

        fs.readdir(pathName, function (err, files) {
            var targetCount = 0;
            var readCount = 0;

            var done = function () {
                if (readCount >= targetCount) {
                    next(list);
                }
            };

            if (files) {
                files.forEach(function (file) {
                    if (file.indexOf(".json") > 0 && file !== "struct.json") {
                        targetCount++;
                        filesystem.readJson(path.join(pathName, file), function (content) {
                            
                            var passed = true;
                            if (filter && filter.length){
                                content = content || {};
                                filter.forEach((f) => {
                                    var v = content[f.key];
                                    if (typeof v === "string") v = v.toLowerCase();
                                    if (v !== f.value) passed = false;
                                })
                            }
                            
                            if (passed){
                                list.push(content);
                            }
                            
                            readCount++;
                            done();
                        });
                    }
                });
                if (targetCount === 0) {
                    done();
                }
            } else {
                done();
            }


        })
    };

    me.getById = function (profile, id, language, next) {
        if (language || !config.multiLanguage || !isProfileMultiLanguage(profile)) {
            var filename = path.join(me.getProfilePath(profile, language), id + ".json");
            filesystem.readJson(filename, next);
        } else {
            var result = {
                multiLanguage: true,
            };
            var targetCount = 0;
            var readCount = 0;
            var done = function () {
                if (readCount >= targetCount) next(result);
            };
            config.languages.forEach(language => {
                targetCount++;
                var filename = path.join(me.getProfilePath(profile, language), id + ".json");
                filesystem.readJson(filename, content => {
                    readCount++;
                    if (content) result[language] = content;
                    done();
                });
            });
        }
    };

    me.update = function (profile, id, form, next) {
        var activeLanguages = [""];
        var fileOut = [];
        if (config.multiLanguage) {
            form = form||{};
            var profileLanguage = form.activelanguage;
            var profileLanguages = form.activelanguages;
            if (profileLanguage) {
                // one single language is saved
                activeLanguages[0] = profileLanguage;
            }
            if (profileLanguages) {
                // multiple languages in 1 batch
                activeLanguages = profileLanguages.split(',');
            }
        }


        var done = function () {
            if (writeCount >= targetCount) {
                eventBus.trigger(eventBus.triggers.profileUpdate,{
                    profile: profile,
                    id: id,
                    form: form,
                    files:fileOut
                });
                next(result);
            }
        };

        function saveFiles() {
            activeLanguages.forEach(language => {
                var folderPath = me.getProfilePath(profile, language, true);
                
                // TODO: backup

                var filename = path.join(folderPath, id + ".json");
                var content = {};
                for (var key in form) {
                    var value = form[key];
                    var include = true;

                    var i = key.indexOf(":");
                    if (i > 0) {
                        if (key.substr(0, i) !== language) include = false;
                        key = key.substr(i + 1);
                    }
                    if (config.multiLanguage && key === "activelanguages") include = false;
                    if (include) {
                        if (key.substr(0, 5) === "json_") {
                            key = key.substr(5);
                            try {
                                value = JSON.parse(value)
                            } catch (e) {
                            }
                        }
                        content[key] = value;
                    }
                }

                content.id = id;

                filesystem.writeFile(filename, content, result => {
                    writeCount++;
                    fileOut.push({
                        language:language,
                        filename: filename,
                        content: content,
                    });
                    done();
                });

            });
        }

        var targetCount = activeLanguages.length;
        var writeCount = 0;

        if (activeLanguages.length){
            if (id === 0) {
                getNextId(profile, newId => {
                    id = newId;
                    saveFiles();
                });
            } else {
                saveFiles()
            }
        }else{
            next("no data");
        }

        var result = id;

    };

    function getNextId(profile, next) {
        var paths = [];
        if (config.multiLanguage) {
            config.languages.forEach(lan => {
                paths.push(me.getProfilePath(profile, lan));
            });
        } else {
            paths.push(me.getProfilePath(profile));
        }

        var maxId = 0;
        var readCount = 0;
        var targetCount = paths.length;
        var done = function(){
            if (readCount>=targetCount) next(maxId+1);
        };

        paths.forEach(folderPath => {
            filesystem.listFolder(folderPath,null, files => {
                readCount++;
                files.forEach(f => {
                   var i = parseInt(f.split(".")[0]);
                   if (!isNaN(i) && i>maxId) maxId=i;
                });
                done();
            })
        });
    }

    me.getStructure = function (profile, next) {
        //var filename = path.join(me.getDataStorePath(), "structures", profile + ".json");
        var filename = path.join(me.getProfilePath(profile),"struct.json");
        filesystem.readJson(filename, next);
    };

    me.getProfilePath = function (profile, language, createIfNotExist) {
        if (!language && config.multiLanguage && config.defaultLanguage) {
            if (profile !== "users") {
                language = config.defaultLanguage;
            }
        }
        
        var pathName = path.join(me.getDataStorePath(), config.profileDirectory, profile);
        if (language) pathName = path.join(pathName, language);

        if (createIfNotExist) {
            filesystem.createFolder(pathName);
        }
        return pathName;
    };

    me.getDataStorePath = function () {
        return path.join(__dirname, '../../', config.dataStoreDirectory);
    };
    

    function isProfileMultiLanguage(profile) {
        return true;
    }

    return me;
}();
module.exports = DataStore;