var File = function(api){
    var me = {};
    const filesystem = require("./common/filesystem.js");
    const path = require("path");

    me.process = async function(apiRequest,next){
        var registeredActions = [
            "info",
            "rename",
            "delete",
            "deletemulti",
            "create",
            "createdirectory",
            "update",
            "move",
            "movemulti",
            "convert",
            "upload",
            "uploadfile"
        ];


        var action = "get";
        var startPathIndex = 0;
        var method = apiRequest.path[startPathIndex];
        if (registeredActions.indexOf(method)>=0){
            action = method;
            startPathIndex++;
            method = apiRequest.path[startPathIndex];
        }
        
        var filePath = filesystem.getPathFromIndex(apiRequest.path,startPathIndex);
        var basePath = filesystem.getFullFilePath(filePath,apiRequest.host);

        switch (action) {
            case "get":
                var isFile = await filesystem.isFile(basePath);
                if (isFile){
                    // return file
                    next(basePath,"file");
                }else{
                    if (typeof isFile === "undefined"){
                        next("File not found","nok");
                    }else{
                        // list directory
                        filesystem.listFolder(basePath,{splitFilesAndFolders: true},next);
                    }

                }
                break;
            case "delete":
                // TODO delete folder?
                var newName = basePath+".deleted";
                filesystem.moveFile(basePath,newName,result => {
                    next("deleted");
                });
                break;
            case "move":
                var filename = path.basename(basePath);
                var newName = path.join(apiRequest.queryParams.to,filename);
                newName = filesystem.getFullFilePath(newName,apiRequest.host);

                console.log("Moving from " + basePath + " to " + newName);
                filesystem.moveFile(basePath,newName,result => {
                    next("moved");
                });
                break;
            case "rename":
                var newName = apiRequest.queryParams.name;
                if (newName){
                    var folderName = path.dirname(basePath);
                    newName = path.join(folderName,newName);
                    filesystem.renameFile(basePath,newName,result => {
                        next("renamed");
                    });
                }else{
                    next("no name","nok");
                }
                break;
            case "update":
                var content = apiRequest.form.editorcontent;
                filesystem.writeFile(basePath,content,result => {
                    next(result,"ok");
                });
                break;
            case "createdirectory":
                filesystem.createFolder(basePath,next);
                break;
            case "uploadfile":
                // upload from admin
                console.log("upload file");
                var files = apiRequest.files || {};
                if (files["files[]"]) files = files["files[]"];
                if (files && files.length && files[0]){
                    var file = files[0];
                    var filename = file.originalFilename;
                    var tempPath = file.path;
                    //console.log(file);
                    filesystem.moveFile(tempPath,path.join(basePath,filename),result => {
                        next("upload to " + basePath + " as " + filename);
                    });
                }else{
                    next("no file");
                }

                break;
            case "upload":
                // upload from admin in article editor
                var files = apiRequest.files;
                if (files["files[]"]) files = files["files[]"];
                if (files && files.length && files[0]){
                    var file = files[0];
                    var filename = file.originalFilename;
                    var tempPath = file.path;

                    var ext = path.extname(filename).toLowerCase();
                    var alloweExtentions = [".png", ".jpg", ".jpeg" ,".txt", ".zip", ".pdf"];

                    if (alloweExtentions.indexOf(ext)){

                        var newFilename = new Date().getTime() + "_" + filename;

                        filesystem.moveFile(tempPath,path.join(basePath,newFilename),result => {
                            next({
                                name: filename,
                                filename: newFilename,
                                uploadpath: basePath,
                                size: 0
                            });
                        })
                    }else{
                        next("file of type " + ext + " not allowed");
                    }
                }else{
                    next("no file");
                }

                break;
            case "info":
                var info = {
                    propscount: 0,
                    file: {
                        name: path.basename(basePath),
                        filetype: path.extname(basePath)
                    },
                    annotations: {
                        tags: ["t","v" ]
                    }
                };
                next(info);
                break;
            default:
                if (next) next("unknown action","nok");
        }

    };

    return me;
}();

module.exports = File;

var api = module.parent.exports;
api.registerModule("file",File);