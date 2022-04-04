var FileSystem = function(){
    var me = {};
    const config = require("../../config.js");
    const fs= require("fs");
    const path = require("path");

    me.readJson = function(filename,next){
        fs.readFile(filename, 'utf8', function(err,content){
            try {
                content = JSON.parse(content);
            }catch (e) {
                content = "";
            }
            if (next) next(content);
        });
    };

    me.readText = function(filename,next){
        fs.readFile(filename, 'utf8', function(err,content){
            if (next) next(content);
        });
    };

    me.createFolder = function(folderPath,next){
        if (!next){
            return fs.existsSync(folderPath) || fs.mkdirSync(folderPath);
        }else{
            fs.mkdir(folderPath, function(err) {
                if (err) {
                    if (err.code === 'EEXIST') next(true);
                    else next(false);
                } else next(true);
            });
        }
    };

    me.createFolderTree = function(folderPath){
        return fs.existsSync(folderPath) || fs.mkdirSync(folderPath, { recursive: true });
    };

    me.listFolder = function(pathName,options,next){
        options = options || {};
        var showFiles = typeof options.showFiles === "boolean" ? options.showFiles : true;
        var showFolders = typeof options.showFolders === "boolean" ? options.showFolders : true;
        var showDeleted = typeof options.showDeleted === "boolean" ? options.showDeleted : false;

        if (options.splitFilesAndFolders){
            showFiles = true;
            showFolders = true;
        }

        var useStats = (!showFiles || !showFolders || options.splitFilesAndFolders);
        var result = options.splitFilesAndFolders ? {directories:[],files:[]} : [];

        fs.readdir(pathName, function (err, files) {
            files = files || [];
            files.forEach(file => {
                var passed = true;
                var stat = {};
                if (path.extname(file) === ".deleted" && !showDeleted) passed = false;
                if (passed && useStats) {
                    stat = fs.lstatSync(path.join(pathName, file));
                    if (stat.isDirectory() && !showFolders) passed = false;
                    if (stat.isFile() && !showFiles) passed = false;
                }
                if (passed) {
                    if (options.splitFilesAndFolders) {
                        (stat.isDirectory() ? result.directories : result.files).push(file);
                    }else{
                        result.push(file);
                    }
                }
            });
            next(result);
        })
    };

    me.writeFile = function(fileName,content,next){
        if (typeof content !== "string") content = JSON.stringify(content,null,2);
        fs.writeFile(fileName, content, function (err) {
            //console.log("write file " + fileName + ' -> ' + (!err));
            if (next) next(!err);
        });
    };

    me.renameFile = function(oldPath, newPath, next){
        fs.rename(oldPath, newPath, function (err) {
            if (err) {
                next();
            } else {
                next();
            }
        });
    };

    me.moveFile = function(oldPath, newPath, next){
        fs.rename(oldPath, newPath, function (err) {
            if (err) {
                if (err.code === 'EXDEV') {
                    copy();
                } else {
                    fs.unlink(oldPath, next);
                    //next();
                }
            }else{
                next();
            }
        });


        function copy() {
            var readStream = fs.createReadStream(oldPath);
            var writeStream = fs.createWriteStream(newPath);

            readStream.on('error', next);
            writeStream.on('error', next);

            readStream.on('close', function () {
                fs.unlink(oldPath, next);
            });

            readStream.pipe(writeStream);
        }
    };

    me.copyFile = function(_from,_to){
        fs.copyFile(_from, _to, (err) => {
            if (err){
                console.error('error copying ' + _from + " to " + _to);
            }
        });
    };

    me.isFile = function(fileName){
        return new Promise (next => {
            fs.lstat(fileName,function(err,stats){
                if (err){
                    next(undefined);
                }else{
                    next(stats.isFile());
                }
            });
        });
    };

    me.getFile = function(fileName){
        if (fileName.indexOf(".jpg")>0) return true;
    };

    me.getFullFilePath = function(pathName,host){
        pathName = pathName || "";
        return config.getFileBasePath(pathName,host);
    };

    me.getPathFromIndex = function(array,index){
        var result = "";
        for (var i = index, max = array.length; i<max; i++){
            result += "/" + array[i];
        }
        return result;
    };

    return me;
}();
module.exports = FileSystem;
