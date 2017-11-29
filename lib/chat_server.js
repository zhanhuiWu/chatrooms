var socketio = require("socket.io");
var fs = require("fs");
var io;
var guestNumber = 1;
var nickNames  = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server){
	io = socketio.listen(server);
	
	io.set("log level", 1);
	
	io.sockets.on('connection', function(socket){
		//进入聊天室时分配名字
		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
		
		//第一次进入默认进入到Lobby
		joinRoom(socket, "Lobby");
		
		//进入房间的消息广播
		handleMessageBroadcasting(socket, nickNames);
		
		//第一次进入房间时将名字给为默认分配的名
		handleNameChangeAttempts(socket, nickNames, namesUsed);
		
		//进入房间
		handleRoomJoining(socket);
		
		//进入房间后提供右侧的房间列表
		socket.on("rooms", function(){
			socket.emit('rooms', io.sockets.manager.rooms);
		});
		
		socket.on("picture", function(pic){
			var message  = {};
			console.log("pic.fileName: " + pic.fileName);
			console.log("pic.file.size: " + pic.file.size);
			fs.writeFile("./" + pic.fileName, pic.file, function(err, data){
				if(err){
					message.text = "upload failed.";
				} else{
					message.text = "upload success!";
				}
			});
			socket.emit("message", message);
		});
		
		//离线处理
		handleClientDisconnection(socket, nickNames, namesUsed);
	});
};

function assignGuestName(socket, guestNumber, nickName, namesUsed){
	var name = 'Guest' + guestNumber;
	nickNames[socket.id] = name;
	socket.emit("nameResult", {
		success: true,
		name: name
	});
	namesUsed.push(name);
	return guestNumber + 1;
}

function joinRoom(socket, room){
	socket.join(room);
	currentRoom[socket.id] = room;
	socket.emit("joinResult", {room: room});
	console.log("Change room broadcast!");
	socket.broadcast.to(room).emit('message', {
		name: "System",
		text: nickNames[socket.id] + " has joined " + room + "."
	});
	
	var usersInRoom = io.sockets.clients(room);
	if(usersInRoom.length > 1){
		var usersInRoomSummary = "Users currently in " + room + ": ";
		for(var index in usersInRoom){
			var userSocketId = usersInRoom[index].id;
			if(userSocketId != socket.id){
				if(index > 0){
					usersInRoomSummary += ", ";
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
		usersInRoomSummary += ".";
		socket.emit("message", {name: "System", text: usersInRoomSummary});
	}
	console.log("complete!");
}

function handleNameChangeAttempts(socket, nickNames, namesUsed){
	socket.on('nameAttempt', function(name){
		console.log("Change name attempt is received. (nickName --> " + name + ")");
		if(name.indexOf("Guest") == 0){
			socket.emit("nameResult", {
				success: false,
				message: 'Name cannot begin with "Guest".'
			});
		}else{
			if(namesUsed.indexOf(name) == -1){
				var previousName = nickNames[socket.id];
				console.log("Previous name --> " + previousName + ")");
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;
				delete namesUsed[previousNameIndex];
				console.log("New nickname --> " + previousName + ")");
				socket.emit('nameResult', {
					success: true,
					name: name
				});
				
				console.log("Begin to broadcast new nickname");
				socket.broadcast.to(currentRoom[socket.id]).emit('message', {
					name: "System",
					text: previousName + " is now known as " + name + "."
				});
				console.log("Complete!");
			}else{
				socket.emit('nameResult', {
					success: false,
					message: 'That name is already in use.'
				});
			}
		}
	})
}

function handleMessageBroadcasting(socket){
	socket.on('message', function(message){
		if(message.to){
			sendMessageToSomeBody(socket, message);
		}else{
			sendMessageToChatRoom(socket, message);
		}
	});
}

function sendMessageToSomeBody(socket, message){
	var usersInRoom = io.sockets.clients(message.room);
	for(var index in usersInRoom){
		var targetSocket = usersInRoom[index];
		if(message.to == nickNames[targetSocket.id]){
			targetSocket.emit("privateMessage", {
				type: message.type,
				name: nickNames[socket.id],
				text: message.text
			});
			break;
		}
	}
}

function sendMessageToChatRoom(socket, message){
	socket.broadcast.to(message.room).emit('message', {
		type: message.type,
		name: nickNames[socket.id],
		text: message.text
	});
}

function handleRoomJoining(socket){
	socket.on('join', function(room) {
		console.log("Change room attempt is received. (new room name --> " + room.newRoom + ")");
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
	});
}

function handleClientDisconnection(socket){
	socket.on('disconnect', function(){
		var nameIndex = namesUsed.indexOf(nickNames[socket.io]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}