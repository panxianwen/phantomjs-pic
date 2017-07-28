'use strict';
var express = require('express');
var app = express();
var router = express.Router();
var phantom = require('phantom');
var async = require('async');
var path = require('path');

var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html'],
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now())
  }
}
app.use(express.static('public', options));

var base_cookies = [
	{
		"domain": "10.249.216.50",
		"expirationDate": 1500799506,
		"hostOnly": true,
		"httpOnly": false,
		"name": "_ks_cookie_loginStatus",
		"path": "/",
		"sameSite": "no_restriction",
		"secure": false,
		"session": false,
		"storeId": "0",
		"value": "%7B%22userId%22%3A%2244%22%2C%22token%22%3A%229d1cd98d-ee97-4250-a0be-724f2b1548dc%22%2C%22isRemember%22%3Atrue%2C%22realName%22%3A%22%u4E1C%u65B9%u56FD%u4FE1%u6D4B%u8BD5%22%2C%22deptName%22%3A%22%u7814%u53D1%u90E8%22%7D",
		"id": 1
	},
	{
		"domain": "10.249.216.50",
		"hostOnly": true,
		"httpOnly": true,
		"name": "JSESSIONID",
		"path": "/",
		"sameSite": "no_restriction",
		"secure": false,
		"session": true,
		"storeId": "0",
		"value": "9d1cd98d-ee97-4250-a0be-724f2b1548dc",
		"id": 2
	}
	];
	var requestIDArr = [];
/* GET home page. */
router.get('/', function(req, res, next) {
  var fs = require('fs');
  async.series({
    one: function(callback){

      var sitepage = null;
      var phInstance = null;
      phantom.create()
          .then(instance => {
          phInstance = instance;
		  instance.onConsoleMessage = function(msg, lineNum, sourceId) {
			console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
		  };
          return instance.createPage();
      })
        .then(page => {
          sitepage = page;
        var width = 1349;
        var height = 1883;
        page.property('viewportSize', {
          width: width, height: height
        });
		for(var i in base_cookies) {        
			page.invokeMethod('addCookie',base_cookies[i]);
		}
		//page.addCookie(base_cookies)
      
        return page.open('http://10.249.216.50:3005/indexDetails');
        let cookies = page.cookies();
		for(var i in cookies){
			console.log(JSON.stringify(page.cookies[i]));
		}
      })
        .then(status => {
          console.log(status);
		  var domId = "indexDetails-cityRank"
		  return sitepage.evaluate(function(id) {
			/*document.getElementById('ws-login-username').value = 'hq';
			document.getElementById('ws-login-password').value = 'bonc1q2w3e';
			document.getElementById('ws-login-code').value = '123456';
			document.getElementById('submitIdClick').click();*/
			
			/*document.querySelector("#ws-login-username").value = 'hq';
			document.querySelector("#ws-login-password").value = 'bonc1q2w3e';
			document.querySelector("#ws-login-code").value = '123456';
			document.querySelector("#submitIdClick").click();*/
			
			//此函数在目标页面执行的，上下文环境非本phantomjs，所以不能用到这个js中其他变量
			//var div = document.getElementById(id); //要截图的div的id
			//var div = document.getElementsByClassName(id); //要截图的div的id
			var div = document.body; //要截图的div的id
			var bc = div.getBoundingClientRect();
			var top = bc.top;
			var left = bc.left;
			var width = bc.width;
			//var height = bc.height;
			var height = 1883;
			window.scrollTo(0, 10000);//滚动到底部
			return [top, left, width, height];
        }, domId);

      })
        .then(length => {
          var newpage = sitepage;
        sitepage.property('clipRect', { //截图的偏移和宽高
          top: length[0],
          left: length[1],
          width: length[2],
          height: length[3]
        });
        return newpage;
      })
        .then(newpage => {
          newpage.render('test.png');  //渲染图片
        //newpage.close();
        //phInstance.exit();

        //callback(null,'generator'); //async.series顺序执行，在生成图片后调用回调函数后执行下载图片
        setTimeout(function() {
          callback(null,'generator');
        }, 1000);
      })
        .catch(error => {
          console.log(error);
        phInstance.exit();
      });
	  
	 
    },
    two: function(callback){
      var currFile = 'test.png',fReadStream,fileName='test.png';
      fs.exists(currFile,function(exist) {
        if(exist){
          res.set({
            "Content-type":"application/octet-stream",
            "Content-Disposition":"attachment;filename="+encodeURI(fileName)
          });
          fReadStream = fs.createReadStream(currFile);
          //console.log(fReadStream)
          fReadStream.on("data",function(chunk){res.write(chunk,"binary")});
          fReadStream.on("end",function () {
            res.end();
          });
        }else{
          res.set("Content-type","text/html");
          res.send("file not exist!");
          res.end();
        }
      });
      callback(null, 'download');
    }
  },function(err, results) {
    console.log(results);
  });
});

module.exports = router;
