//MODULES
var http = require('http')
var io = require('socket.io')

//VARS
var server_port = 4444;

//HTTP SERVER
//create http server
var server = http.createServer()
//set listen port for http server
server.listen(server_port)

//MESSAGES
//this is where we store messages
var messages = new Array()
//define save method for Array
Array.prototype.save = function(element) {
    this.push(element)
}

//USERS
//this is where we store users
var users = new Array()

//ROOMS
//this is where we store rooms
var rooms = new Array()
rooms.save('default');

//SOCKET.IO
//set listen for specific http server
io=io.listen(server)
//set options
io.set ('transports', ['xhr-polling', 'jsonp-polling'])
io.set('log level', 1); //remove junk log messages
//define events
io.sockets.on('connection', function(client) {

	//on new user
	client.on('add_user', function(username,room){
		//set username on client for later use
		client.username = username;
		//set room on client for later use
		client.room = room;
		//add user to users array
		users.save(username);
		//join client to room
		client.join(room);
		//send message to new user message feed
		client.emit('get_messages', 'sys-joinedroom', 'you have been connected to new room: '+room);
		//send message to all room members message feed
		client.broadcast.to(room).emit('get_messages', 'sys-joinedroom', username + ' is now connected to this room');
		//send room list to clients
		client.emit('get_rooms', rooms);
	});
	
	//on new message
	client.on('new_message', function (data) {
		//send messages to all room members message feed
		io.sockets.in(client.room).emit('get_messages', client.username, data);
	});
	
	//on new message
	client.on('new_room', function (newroom) {
		//add room to rooms array
		rooms.save(newroom);
		//send message to new user message feed
		client.emit('get_messages', 'sys-newroom', 'Check out new room: '+newroom);
		//send new message to all connected clients
        client.broadcast.emit('get_messages', 'sys-newroom', 'Check out new room: '+newroom);
		//send room list to current user message feed
		client.emit('get_rooms', rooms);
		//send room list to clients
		client.broadcast.emit('get_rooms', rooms);
	});
	
	//on client switching room
	client.on('switch_room', function(newroom){
		//leave room
		client.leave(client.room);
		//join client to new room
		client.join(newroom);
		//send message to new user message feed
		client.emit('get_messages', 'sys-joinedroom', 'you have been connected to new room: '+ newroom);
		//send message to all old room members message feed
		client.broadcast.to(client.room).emit('get_messages', 'sys-leftroom', client.username+' has left this room');
		//set room on client object property for later use
		client.room = newroom;
		//send message to all room members message feed
		client.broadcast.to(newroom).emit('get_messages', 'sys-joinedroom', client.username+' has joined this room');
	});
	
	//on client disconnect
	client.on('disconnect', function(){
		//send message to all members
		client.broadcast.emit('get_messages', 'sys-disconnected', client.username + ' has disconnected');
		//delete user from users array
		delete users[client.username];
		//leave room
		client.leave(client.room);
	});
})
