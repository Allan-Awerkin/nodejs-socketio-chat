//MODULES
var http = require('http')
var io = require('socket.io')
var db = require('mysql')

//VARS
var server_port = 4444;
var db_host='localhost';
var db_name='chat';
var db_user='';
var db_user_password='';

//HTTP SERVER
//create http server
var server = http.createServer()
//set listen port for http server
server.listen(server_port)

//DB
var connection = db.createConnection({
  host     : db_host,
  database : db_name,
  user     : db_user,
  password : db_user_password,
});

//SOCKET.IO
//set listen for specific http server
io=io.listen(server)
//set options
io.set ('transports', ['xhr-polling', 'jsonp-polling'])
io.set('log level', 1); //remove junk log messages
//define events
io.sockets.on('connection', function(client) {
	//get messages from db
	connection.query('SELECT * FROM messages ORDER BY created LIMIT 0,30', function(err, rows, fields) {
		//if error throw it
		if (err) throw err;
		//send all messages to newly connected client
		client.emit("init", JSON.stringify(rows))
	});
    client.on('new_message', function(msg) {
		//parse json message
        var newmessage = JSON.parse(msg)
		//save message to db
		connection.query("INSERT INTO messages(username,message) VALUES('"+newmessage.username+"','"+newmessage.message+"')", 
		function(err, rows, fields) {
			//if error throw it
			if (err) throw err;
		});
		//send new message to all connected clients
        client.broadcast.emit('new_message', msg)
    })
})
