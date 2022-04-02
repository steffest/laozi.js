var Cookie = function () {
    // simpluyfied from https://github.com/pillarjs/cookies/blob/master/index.js
    var me = {};
    var cache = {};

    var cookieAge = 1000*60*60*24*365; //1 year

    me.get = function(req,name){
        var header;
        var match;

        header = req.headers["cookie"];
        if (!header) return;

        match = header.match(getPattern(name));
        if (!match) return;

        return match[1];
    };

    me.set = function(req,res,name,value){
        var headers = res.getHeader("Set-Cookie") || [];
        var expires = new Date(Date.now() + cookieAge).toUTCString();
        var cookie =  name + "=" + value + '; expires=' + expires;
        headers.push(cookie);
        var setHeader = res.set ? http.OutgoingMessage.prototype.setHeader : res.setHeader;
        setHeader.call(res, 'Set-Cookie', headers);
    };

    function getPattern(name) {
        if (cache[name]) return cache[name];

        return cache[name] = new RegExp(
            "(?:^|;) *" +
            name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") +
            "=([^;]*)"
        )
    }

    return me;
}();
module.exports = Cookie;