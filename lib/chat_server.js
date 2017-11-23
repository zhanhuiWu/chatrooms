var socketio = require("socket.io");
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
	return guestNumber;
}

function joinRoom(socket, room){
	socket.join(room);
	currentRoom[socket.id] = room;
	socket.emit("joinResult", {room: room});
	socket.broadcase.to(room).emit('message', {
		text: nickNames[socket.id] + " has joined " + room + "."
	});
	
	var usersInRoom = io.sockets.clients[room];
	if(usersInRoom.length > 1){
		var userSocketId = usersInRoom[index].id;
		if(userSocketId != socket.id){
			if(index > 0){
				userInRoomSummary += ",";
			}
			usersInRoomSummary += nickNames[userSocketId];
		}
	}
	usersInRoomSummary += "1";
	socket.emit("message", {text: usersInRoomSummary});
}

function handleNameChangeAttempts(socket, nickNames, namesUsed){
	sockett.on('nameAttempt', function(name){
		if(name.indexOf("Guest") == 0){
			socket.emit("nameResult", {
				success: false,
				message: 'Name cannot begin with "Guest".'
			});
		}else{
			if(namesUsed.indexOf(name) == -1){
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[soccket.id] = name;
				delete namesUsed[previousNameIndex];
				socket.emit('nameResult', {
					success: true,
					name: name
				});
				socket.broadcase.to(currentRoom[socket.id]).emit('message', {
					text: previousName + " is now known as " + name + "."
				});
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
		socket.broadcase.to(message.room).emit('message', {
			text: nickNames[sockets.id] + ': ' + message.text
		});
	});
}

function handleRoomJoining(socket){
	socket.on('join', function(room) {
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
	});
}

function handleClientDisconnection(socket){
	socket.on('disconnect', function(){
		var nameIndex = namesUsed.indexOf(nickNames[socket,io]);
		delete namesUsed[nameIndex];
		delete nickNamess[socket.id];
	});
}