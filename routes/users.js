'use strict';
var express = require('express');
var router = express.Router();
var phantom = require('phantom');
var fs = require('fs');
var $ = require("jquery");

/* GET users listing. */
router.get('/', function(req, res, next) {
	
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
	
	phantom.create().then(function (ph) {
		ph.createPage().then(function (page) {
			//page.addCookie(base_cookies);
			 for(var i in base_cookies) {        
				 page.invokeMethod('addCookie',base_cookies[i]);
			 }
			
			
			page.open('http://10.249.216.50:3005/login').then(function (status) {
				console.log(status)
			
				page.evaluate(function() {
					/*
					document.getElementById('ws-login-username').value = 'hq';
					document.getElementById('ws-login-password').value = 'bonc1q2w3e';
					document.getElementById('ws-login-code').value = '123456';
					document.getElementById('submitIdClick').click();
					*/
					//document.querySelector("#ws-login-username").value = 'hq';
					//document.querySelector("#ws-login-password").value = 'bonc1q2w3e';
					//document.querySelector("#ws-login-code").value = '123456';
					//document.querySelector("#submitIdClick").click();
					
					//return $("#username");
				});
				setTimeout(print_cookies,15000);
				
			}).catch(error => {
				console.log(error);
				ph.exit();
			});
			page.on('remote.message', function(msg) {
				this.log(msg, 'info');
			});
			
			function print_cookies(){
				console.log("running print_cookies");
				for(var i in page.cookies){
					console.log(JSON.stringify(page.cookies[i]));
				}
				//capture(page_url,filename);
			}
		});
	});
	

  

});

module.exports = router;
