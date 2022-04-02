var Image = function(api){
    var me = {};
    const filesystem = require("./common/filesystem.js");
    const fs = require('fs');
    const path = require("path");
    const punycode = require("punycode");

    //const piexif = require("./common/exif.js");
    //const xmpReader = require('xmp-reader');
    //const XMP = require("xmp-js");
    //const exifr = require('exifr');
    //const exiftool = require('node-exiftool');
    //const exiftoolBin = require('dist-exiftool');



    me.process = function(apiRequest,next){

        var registeredActions = [
            "info"
        ];

        var startPathIndex = 0;
        var method = apiRequest.path[startPathIndex];
        var action = "";

        // TODO - walk tree of url options
        if (method){
            if (registeredActions.indexOf(method)>=0){
                action = method;
                startPathIndex++;
                method = apiRequest.path[startPathIndex];
            }else{
                if (method && method.indexOf("x")>=0){
                    // TODO: thumbnail
                    startPathIndex++;
                }
            }
        }

        var filePath = filesystem.getPathFromIndex(apiRequest.path,startPathIndex);
        var fullFilePath = filesystem.getFullFilePath(filePath,apiRequest.host);

        var handled = false;
        if (action === 'info'){
            me.getImageInfo(fullFilePath,next);
            handled = true;
        }

        if (!handled){
            // return image;
            next(fullFilePath,"file");
        }
    };

    me.isImage = function(filename){
        if (filename){
            var ext = filename.split(".").pop().toLowerCase();
            if ((ext === "jpg") || (ext === "jpeg") || (ext === "png")){
                return true;
            }
        }
        return false;
    };

    me.getImageInfo = function(fullFilePath,next){
        var info = {
            propscount: 0,
            file: {
                name: path.basename(fullFilePath),
                filetype: path.extname(fullFilePath)
            },
            exif: {},
            annotations: {
                tags: []
            }
        };

        fs.stat(fullFilePath, function(err, stats) {
            if (err){
                info.err = err;
                next(info);
            }else{
                var probe = require('probe-image-size');
                var input = fs.createReadStream(fullFilePath);
                probe(input).then(result => {
                    //console.log(result);

                    input.destroy();

                    info.width = result.width;
                    info.height = result.height;
                    info.file.size = stats.size;
                    info.file.created = Math.round(stats.ctimeMs);
                    info.file.modified = Math.round(stats.mtimeMs);
                    info.file.accessed = Math.round(stats.atimeMs);
                    info.file.mime = result.mime;
                    //info.stats = stats;


                    var jpeg = fs.readFileSync(fullFilePath);
                    var data = jpeg.toString("binary");
                    var exifObj = piexif.load(data);
                    info.exif = {};

                    for (var ifd in exifObj) {
                        if (ifd === "thumbnail") {
                            continue;
                        }
                        info.exif[ifd] = {};
                        //console.log("-" + ifd);
                        for (var tag in exifObj[ifd]) {
                            var tagName = piexif.TAGS[ifd][tag]["name"];
                            //info.exif[ifd][tagName] =  exifObj[ifd][tag];
                            if (tagName === "XPSubject"){
                                info.exif[ifd][tagName] =  punycode.ucs2.encode(exifObj[ifd][tag]);
                            }
                            if (tagName === "XPKeywords"){
                                info.exif[ifd][tagName] =  punycode.ucs2.encode(exifObj[ifd][tag]);
                            }

                        }

                    }


                    // var buf = Buffer.from(jpeg, 'binary');
                    // info.buf = buf.length;

                    let xmp = new XMP(jpeg);

                    info.xmp = {
                        raw:xmp.find(),
                        parsed: xmp.parse()
                    };
                    info.exif.xmp = info.xmp.parsed;
                    if (info.exif.xmp && info.exif.xmp.subject && info.exif.xmp.subject.length && info.exif.xmp.subject.forEach){
                        info.exif.xmp.subject.forEach(tag => {
                            addTag(info.annotations.tags,tag);
                        })
                    }

                    xmpReader.fromFile(fullFilePath, (err, data) => {
                        if (err)
                            info.exif2 = err;
                        else
                            info.exif2 = data;

                        if (info.exif2 && info.exif2.keywords){
                            info.exif2.keywords.forEach(tag => {
                                addTag(info.annotations.tags,tag);
                            })

                        }

                        exifr.parse(fullFilePath).then((output) => {
                            info.exif3 = output;
                            //exifTool(fullFilePath,epInfo=>{
                            //    info.exifTool = epInfo;
                            //    next(info);
                            //})
                            next(info);
                        });

                    });

                });
            }
        });
    };

    function addTag(list,tag){
        if (list && list.indexOf(tag)<0){
            list.push(tag);
        }
    }

    function exifTool(filePath,next){
        let info = {};
        var ep = new exiftool.ExiftoolProcess(exiftoolBin);
        ep
            .open()
            .then(() => ep.readMetadata(filePath, ['-File:all']))
            .then(epInfo=>{
                info=epInfo;
            })
            .then(() => {
                ep.close();
                next(info);
            })
            .catch(err=>{
                info=err;
                next(info);
            });

        //next("info");
    }

    return me;
}();

module.exports = Image;

var api = module.parent.exports;
api.registerModule("image",Image);