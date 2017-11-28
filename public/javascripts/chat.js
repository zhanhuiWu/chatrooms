/**
 * 定义了Chat类.
 * @param socket socket客户端
 * @constructor
 */
var Chat = function(socket){
	this.socket = socket;
	this.name = "";
};

Chat.prototype.name = function(){
	return this.name;
};

/**
 * 用于处理聊天发送以及一些"/"命令
 * @param room room表示发送的房间
 * @param text text表示发送的内容
 */
Chat.prototype.sendMessage = function(room, text){
	var message = {
		room: room,
		text: text
	};
	this.socket.emit('message', message);
};

/**
 * 处理更换聊天房间的命令
 * @param room room表示发送的房间
 */
Chat.prototype.changeRoom = function(room){
	this.socket.emit('join', {
		newRoom: room
	});
};

/**
 * 处理命令,如发送消息,"/"命令,可以用于后续扩展
 * @param command 命令(消息)
 * @returns {Boolean, String} fasle表示正常处理, 字符串表示错误信息
 */
Chat.prototype.processCommand = function(command){
	var words = command.split(' ');
	
	var command = words[0]
						.substring(1, words[0].length)
						.toLowerCase();
	console.log(command);
	var message = false;
	switch(command){
		case 'join': 
			words.shift();
			var room = words.join(' ');
			this.changeRoom(room);
			break;
		case 'nick':
			words.shift();
			console.log("User is attempt to change the nick name");
			var name = words.join(' ');
			this.socket.emit('nameAttempt', name);
			break;
		defualt:
			message = 'Unrecognized command.';
			break;
	}
	return message;
};

