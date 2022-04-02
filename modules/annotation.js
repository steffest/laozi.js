var Annotation = function(){
    var me = {};
    const filesystem = require("./common/filesystem.js");
    const dataStore = require("./common/datastore.js");
    const path = require("path");
    const fs = require('fs');
    const punycode = require("punycode");
    const image = require("./image.js");
    const piexif = require("./common/exif.js");

    me.process = function(apiRequest,next){

        var action = "get";
        var startPathIndex = 0;
        var method = apiRequest.path[startPathIndex];
        var handled = false;

        if (method === "tags"){
            startPathIndex++;
            var tag = apiRequest.path[startPathIndex++];
            if (tag === 'path'){
                action='path';
            }else{
                action = apiRequest.path[startPathIndex++];
                var target = apiRequest.path[startPathIndex++];
            }


            var filePath = filesystem.getPathFromIndex(apiRequest.path,startPathIndex);
            var fullFilePath = filesystem.getFullFilePath(filePath,apiRequest.host);

            switch (action){
                case "add":
                    var data = {
                        'Keywords+': [ tag ],
                        'Subject+': [ tag ],
                    };
                    writeExif(fullFilePath,data,next);
                    break;
                case "remove":
                    var data = {
                        'Keywords-': [ tag ],
                        'Subject-': [ tag ],
                    };
                    writeExif(fullFilePath,data,next);
                    break;
                case "add2":
                    var jpeg = fs.readFileSync(fullFilePath);
                    var data = jpeg.toString("binary");
                    var exifObj = piexif.load(data);


                    exifObj["0th"] = exifObj["0th"] || {};
                    let keywords = exifObj["0th"]["XPKeywords"];
                    if (keywords){
                        keywords = punycode.ucs2.encode(keywords);
                    }else{
                        keywords = "";
                    }
                    //keywords += "; " + tag;
                    keywords = tag + ";";
                    exifObj["0th"][piexif.ImageIFD.XPKeywords] = punycode.ucs2.decode(keywords);
                    var exifStr = piexif.dump(exifObj);

                    var inserted = piexif.insert(exifStr,data);
                    //var buf = Buffer.from(inserted, 'base64');
                    fs.writeFile(fullFilePath + ".update.jpg",inserted,'binary',(err)=>{
                        next({
                            tag: tag,
                            action: action,
                            filePath: fullFilePath,
                            err: err
                        });
                    });

                    break;
                case "path":
                    filesystem.listFolder(fullFilePath,{showFolders: false},function(list){
                        var out = [];
                        var count = 0;
                        var max = list.length;
                        function getInfo(item){
                            if (image.isImage(item)){
                                image.getImageInfo(fullFilePath + "/" + item,info=>{
                                    var tags = (info && info.annotations) ? info.annotations.tags : [];
                                    out.push({
                                        filename: item,
                                        tags: tags,
                                    });
                                    done();
                                });
                            }else{
                                done();
                            }
                        }

                        function done(){
                            count++;
                            if (count>=max) next({files: out});
                        }

                        if (count>=max){
                            next({files: out});
                        }else{
                            list.forEach(item=>{
                                getInfo(item);
                            });
                        }

                    });
                    break;
                default:
                    next({
                        tag: tag,
                        action: action,
                        filePath: fullFilePath
                    });
            }



            handled = true;
        }

        if (method === "tags.json"){

            var basePath = filesystem.getFullFilePath("_system/tags.txt" ,apiRequest.host);
            filesystem.readText(basePath,content=>{
                content = content || "";
                var tags = content.split("\n");
                var list = [];
                var currentParent = 0;
                tags.forEach((tag,index)=>{
                    let parent = 0;
                    let id = index+1;
                    if (tag.substr(0,1) === " "){
                        parent = currentParent;
                        tag = tag.trim();
                    }else{
                        currentParent = id;
                    }
                    tag = tag.split("\r").join("");
                    list.push({id:id, name: tag, parent: parent})
                });
                next(list);
            });
            handled = true;
        }

        if (!handled){
            next("unknown method: " + method);
        }
    };


    function writeExif(fullFilePath,data,next){
        const exiftool = require('node-exiftool');
        const exiftoolBin = require('dist-exiftool');
        const ep = new exiftool.ExiftoolProcess(exiftoolBin);

        var doRename = false;

        ep
            .open()
            .then(() => ep.writeMetadata(fullFilePath, data,['overwrite_original']))
            .then(out=>{
                    if (out && out.error && out.error.indexOf("Error renaming temporary file")>=0){
                        doRename = true;
                    }else{
                        next({
                            filePath: fullFilePath,
                            out: out
                        });
                    }
                },

                err=>{
                    next({
                        filePath: fullFilePath,
                        errn: err
                    });
                }

            )
            .then(
                () => {
                    ep.close();
                    if (doRename){
                        setTimeout(()=>{
                            filesystem.renameFile(fullFilePath + "_exiftool_tmp",fullFilePath);
                            next({
                                filePath: fullFilePath,
                                out: "check rename"
                            });
                        },1000);
                    }
                }
            )
            .catch(err=>{
                next({
                    filePath: fullFilePath,
                    errCatch: err
                });
            });
    }

    return me;
}();

module.exports = Annotation;

var api = module.parent.exports;
api.registerModule("annotation",Annotation);