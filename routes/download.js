'use strict';
var express = require('express');
var app = express();
var router = express.Router();
var phantom = require('phantom');
var async = require('async');
var path = require('path');
var bodyParser = require('body-parser');

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
// 创建 application/x-www-form-urlencoded 编码解析
app.use(bodyParser.urlencoded({ extended: false }));

var base_cookies_remote = [
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
	var base_cookies = [
		{
			"domain": "localhost",
			"expirationDate": 1500783353,
			"hostOnly": true,
			"httpOnly": false,
			"name": "_ks_cookie_loginStatus",
			"path": "/",
			"sameSite": "no_restriction",
			"secure": false,
			"session": false,
			"storeId": "0",
			"value": "%7B%22userId%22%3A%2244%22%2C%22token%22%3A%22a1688d33-d0e9-43d3-baa7-af824b025486%22%2C%22isRemember%22%3Atrue%2C%22realName%22%3A%22%u4E1C%u65B9%u56FD%u4FE1%u6D4B%u8BD5%22%2C%22deptName%22%3A%22%u7814%u53D1%u90E8%22%7D",
			"id": 1
		}
		];
	//var page_url = 'http://10.249.216.50:3005/indexDetails',
	var page_url = 'http://localhost:3000/',
		page_url_remote = 'http://10.249.216.50:3006/dayOverView',
		filename = '../public/images/test.png',
		//filename = 'test.png',
		countTotal = 1000,
		seconds = 10000,
		requestIDArr = [],
		domId = "dayOverview-billingRevenue-full",
		imageName = "test.png";

/* GET home page. */
router.get('/', function(req, res, next) {
	page_url_remote = req.query.url;
	
	domId = req.query.domId;
	console.info(domId)
	filename = '../public/images/'+req.query.filename + ".png";
	var new_filename = req.query.filename;  
	imageName =  new_filename + ".png"
	console.info(page_url_remote,domId,new_filename)
  var fs = require('fs');
  async.series({
    one: function(callback){

      var sitepage = null;
      var phInstance = null;
      phantom.create()
          .then(instance => {
          phInstance = instance;
          return instance.createPage();
      })
	  .then(page => {
        sitepage = page;
		//写入cookie信息
		for(var i in base_cookies_remote) {        
			page.invokeMethod('addCookie',base_cookies_remote[i]);
		}
		//page.addCookie(base_cookies)
        	var width = 1366;
		//var height = 1883;
		var height = 768;
		page.property('viewportSize', {
		  width: width, height: height
		});
		
        return page.open(page_url_remote);
      })
      .then(status => {
			if("success" === status){
				console.log("open page succeed");
				checkReadyState(page_url,filename,domId,callback);
			}else{
				console.log("open page failed");
				page.close();
				phInstance.exit();
			}
			function checkReadyState(url,filename,domId,callback,count){
				var count = count || 0;
				console.log("this is the "+count+"time check ready state");
				var timeout = setTimeout(function(){  
					console.info(requestIDArr.length);
					if(requestIDArr.length==0){
						onPageReady(url,filename,domId,callback);
					}else{
						console.log("still waiting for resoinse id is "+requestIDArr.join(","))
						if(count>countTotal){
							clearTimeout(timeout);
							console.log("has tryed "+(countTotal*seconds/1000)+" seconds,but still failed get correct data");
							closePhantom();
							return false;
						}
						count++;
						checkReadyState(url,filename,domId,callback,count);
					}
				},seconds);
			}
			function onPageReady(url,filename,domId,callback){  //页面完全加载完了（包含异步请求的数据的渲染也完成了） 
				var id = domId;
				return sitepage.evaluate(function(id) {
			
					//此函数在目标页面执行的，上下文环境非本phantomjs，所以不能用到这个js中其他变量
					var div = document.querySelector("#"+id); //要截图的div的id
					var bc = div.getBoundingClientRect();
					var top = bc.top;
					var left = bc.left;
					var width = bc.width;
					var height = bc.height;
					//var height = 1883;
					window.scrollTo(0, 10000);//滚动到底部
					return [top, left, width, height];
				},id)
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
					setTimeout(function () {  
						newpage.render(filename);  //渲染图片
						newpage.close();
						phInstance.exit();
					 }, 1000);
					
					//async.series顺序执行，在生成图片后调用回调函数后执行下载图片
					setTimeout(function() {
					  callback(null,'generator');
					}, 3000)
				})
				.catch(error => {
					console.log(error);
					phInstance.exit();
				});
			}
     
		}) 
	 
    },
    two: function(callback){
      var currFile = filename, fReadStream, fileName=imageName;
      fs.exists(currFile,function(exist) {
        if(exist){
	  res.header('Content-Type', 'application/json;charset=utf-8');
	  res.header('Access-Controle-Allow-Origin', '*');
          res.set({
            "Content-type":"application/octet-stream",
            "Content-Disposition":"attachment;filename="+encodeURI(fileName,"UTF8")
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
