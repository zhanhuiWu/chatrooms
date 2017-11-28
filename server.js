//内置的http模块提供HTTP服务器和客户端功能
var http = require("http");

//内置的fs模块提供了与文件系统相关的功能
var fs = require("fs");

//内置的path模块提供了与文件系统路径相关的功能
var path = require("path");

//附加的mime模块有根据文件扩展名得出MIME类型的能力
var mime = require("mime");

//cache是用来缓存文件内容的对象
var cache = {};

/**
 * 返回404错误
 * @param response
 */

function send404(response){
	response.writeHead(404, {"Content-Type": "text/plain"});
	response.write('Error 404: resource not found.');
	response.end();
}

/**
 * 返回路由指定的文件(*.js， *.html等)
 * @param response 接收到的请求
 * @param filePath 路由的地址
 * @param fileContents 返回内容
 */
function sendFile(response, filePath, fileContents){
	response.writeHead(
		200,
		{"Content-Type": mime.lookup(path.basename(filePath))}
	);
	response.end(fileContents);
}

/**
 * 主要返回一些静态的文件
 * @param response 请求
 * @param cache 缓存
 * @param absPath 基于根目录的绝对路径
 */
function serverStatic(response, cache, absPath){
	if(cache[absPath]){
		sendFile(response, absPath, cache[absPath]);
	}else{
		fs.exists(absPath, function(exists){
			if(exists){
				fs.readFile(absPath, function(err, data){
					if(err){
						send404(response);
					}else{
						cache[absPath] = data;
						sendFile(response, absPath, data);
					}
				});
			}else{
				send404(response);
			}
		})
	}
}

/**
 * 创建服务器并用于接收和处理请求
 */
var server = http.createServer(function(request, response){
	var filePath = false;
	if(request.url == "/"){
		filePath = "public/index.html";
	}else{
		filePath = "public" + request.url;
	}
	var absPath = "./" + filePath;
	console.log(absPath);
	serverStatic(response, cache, absPath);
});

/**
 * 设置服务器的监听端口
 */
server.listen(3000,  function(){
	console.log("Server listening on port 3000");
});

/**
 * 将设置的服务器交给聊天服务进行监听
 */
var chatServer = require("./lib/chat_server");
chatServer.listen(server);