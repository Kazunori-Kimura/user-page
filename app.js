//app.js
var fs = require("fs"),
    path = require("path"),
    util = require("util"),
    marked = require("marked"),
    ejs = require("ejs"),
    Q = require("q");


Q.fcall(function(){
    //------------------------------
    //markdownのコード装飾にhighlight.jsを使用する
    marked.setOptions({
        highlight: function (code) {
            return require('highlight.js').highlightAuto(code).value;
        }
    });

    //htmlを全削除
    Q.nfcall(fs.readdir, "html").then(function(files){
        files.forEach(function(file){
            if(/\.html$/i.test(file)){
                fs.unlink(path.join("html", file));
            }
        });
    });
}).then(function(){
    //-------------------------------
    //markdownファイルをhtmlに変換

    return Q.nfcall(fs.readdir, "md").then(function(files){
        var data = {
            titles: [],
            posts: {}
        };

        files.forEach(function(item){
            var fp = path.join("md", item),
                st = fs.statSync(fp);

            //タイトル
            var title = util.format("%s [%d-%d-%d %d:%d]",
                item.replace(/\.md$/i, ""),
                st.mtime.getFullYear(),
                st.mtime.getMonth() + 1,
                st.mtime.getDate(),
                st.mtime.getHours(),
                st.mtime.getMinutes());
            //html
            var html = {};
            //ファイル名
            var id = data.titles.length + 1;
            html.name = util.format("%s.html", ("000" + id).slice(-3));
            //markdown -> html
            html.body = marked(fs.readFileSync(fp, {encoding: "utf-8"}));

            //dataに生成したhtmlを保持
            data.titles.push(title);
            data.posts[title] = html;
        }); //end forEach

        return data;
    });

}).then(function(entries){
    //-----------------------------
    //htmlを作成

    //titleをソートしておく
    entries.titles = entries.titles.sort().reverse(); //日付降順

    //template
    var tmplIndex = fs.readFileSync(path.join("template", "index.ejs"), {encoding: "utf-8"}),
        tmplPost = fs.readFileSync(path.join("template", "post.ejs"), {encoding: "utf-8"});

    //index.html
    var htmlIndex = ejs.render(tmplIndex, { titles: entries.titles, posts: entries.posts });
    //ファイル出力
    fs.writeFileSync(path.join("html", "index.html"), htmlIndex, {encoding: "utf-8"});

    //posts
    entries.titles.forEach(function(title){
        var post = entries.posts[title];
        var htmlPost = ejs.render(tmplPost, { title: title, content: post.body });
        console.log(title);
        //ファイル出力
        fs.writeFileSync(path.join("html", post.name), htmlPost, {encoding: "utf-8"});
    }); //end forEach
}).done();

