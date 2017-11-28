var Chat = function(socket){
	this.socket = socket;
};

Chat.prototype.sendMessage = function(room, text){
	var message = {
		room: room,
		text: text
	};
	this.socket.emit('message', message);
};

Chat.prototype.changeRoom = function(room){
	this.socket.emit('join', {
		newRoom: room
	});
};

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

