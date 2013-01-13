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

//SOCKET.IO
//set listen for specific http server
io=io.listen(server)
//set options
io.set ('transports', ['xhr-polling', 'jsonp-polling'])
io.set('log level', 1); //remove junk log messages
//define events
io.sockets.on('connection', function(client) {
	//send all messages to newly connected client
    client.emit('init', JSON.stringify(messages))
    client.on('new_message', function(msg) {
		//parse json message
        var newmessage = JSON.parse(msg)
		//save it to message store
        messages.save(newmessage)
		//send new message to all connected clients
        client.broadcast.emit('new_message', msg)
    })
})
