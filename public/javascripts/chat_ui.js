function divEscapedContentElement(message){
	return $('<div></div>').text(message);
}

function divSystemContentElement(message){
	return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket){
	var message = $('#send-message').val();
	var systemMessage;
	
	if(message.charAt(0) == '/'){
		systemMessage  = chatApp.processCommand(message);
		if(systemMessage){
			$('#messages').append(divSystemContentElement(sysremMessage));
		}
	}else {
		chatApp.sendMessage($('#room').text(), message);
		$('#message').append(divEscapedContentElement("[ME]" + chatApp.name + ": " + message));
		$('#message').scrollTop($('#message').prop('scrollHeight'));
	}
	$('#send-message').val('');
}

var socket = io.connect();
$(document).ready(function(){
	var chatApp = new Chat(socket);
	socket.on('nameResult', function(result){
		var message;
		if(result.success){
			message = 'You are now known as ' + result.name + '';
			chatApp.name = result.name;
		}else{
			message = result.message;
		}
		$('#messages').append(divSystemContentElement(message));
	});
	
	socket.on("joinResult", function(result){
		$('#room').text(result.room);
		$('#message').append(divSystemContentElement('Room changed.'));
	})
	
	socket.on('message', function(message){
		var newElement = $('<div></div>').text(message.text);
		$('#message').append(newElement);
	});
	
	socket.on('rooms', function(rooms){
		$('#room-list').empty();
		
		for(var room in rooms){
			room = room.substring(1, room.length);
			if(room != ''){
				$('#room-list').append(divEscapedContentElement(room));
			}
		}
		
		$('#room-list div').click(function(){
			chatApp.processCommand('/join ' + $(this).text());
			$('#send-message').focus();
		});		
	});
	
	setInterval(function(){
		socket.emit('rooms');
	}, 1000);
	
	$('#send-message').focus();
	
	$('#send-form').submit(function(){
		processUserInput(chatApp, socket);
		return false;
	});
	
	$("#send-picture").change(function(){
		var filePath = this.value;
		var fileName = filePath.split("\\");
		fileName = fileName[fileName.length - 1];
		var ext = filePath.split(".");
		ext = ext[ext.length - 1];
		
		if("*.jpg,*.jpge".indexOf(ext) == -1){
			alert("This file is not a jpeg format pic.");
		}else{
			var file = this.files[0];
			var data = {};
			data.file = file;
			data.fileName = fileName;
			socket.emit("picture", data);
		}
		this.value = "";
	});
});

function sendPic(){
	$("#send-picture").click();
}


