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
			$('#message').append(divSystemContentElement(sysremMessage));
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
		$('#message').append(divSystemContentElement(message));
		$('#message').scrollTop($('#message').prop('scrollHeight'));
	});
	
	socket.on("joinResult", function(result){
		$('#room').text(result.room);
		$('#message').append(divSystemContentElement('Room changed.'));
		$('#message').scrollTop($('#message').prop('scrollHeight'));
	});
	
	socket.on('message', function(message){
		var newElement = "";
		if(message.type == "pic"){
			newElement = $('<img style="height:300px;width:400px;" />');
			newElement.attr("src", message.text);
			newElement = $('<div></div>').append("[" + message.name + "]: ").append(newElement);
		}else{
			newElement = $('<div></div>').text("[" + message.name + "]: " + message.text);
		}
		$('#message').append(newElement);
		$('#message').scrollTop($('#message').prop('scrollHeight'));
	});
	
	socket.on('privateMessage', function(message){
		var newElement = "";
		if(message.type == "pic"){
			newElement = $('<img style="height:300px;width:400px;" />');
			newElement.attr("src", message.text);
			newElement = $('<div></div>').append("Private message from [" + message.name + "]: ").append(newElement);
		}else{
			newElement = $('<div></div>').text("[" + message.name + "]: " + message.text);
		}
		$('#message').append(newElement);
		$('#message').scrollTop($('#message').prop('scrollHeight'));
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
			var fileReader = new FileReader();
			fileReader.readAsDataURL(file);
			fileReader.onload  = function(fileName){
				var data = {};
				data.text = this.result;
				data.room = $('#room').text();
				data.type = "pic";
				socket.emit("message", data);
				var newElement = $('<img />');
				newElement.attr("src", this.result);
				$('#message').append("[ME]" + chatApp.name + ": ").append(newElement);
				$('#message').scrollBottom($('#message').prop('scrollHeight'));
			};
		}
	});
});

function sendPic(){
	$("#send-picture").click();
}

function uploadFile(file_base64, fileName){
	
}


