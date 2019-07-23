// Require the packages we will use:
var fs = require("fs");
var path = require('path');
var express = require('express');
var app = express();
var webpack = require('webpack');
//var config = require('./webpack.config');
var server = require('http').createServer(app);
var socketio = require("socket.io");
//var compiler = webpack(config);

app.use(express.static(path.join(__dirname, '/')));
app.get('/', function(req, res){
    fs.readFile("client.html", function(err, data){
        // This callback runs when the client.html file has been read from the filesystem.

        if(err) return resp.writeHead(500);
        resp.writeHead(200);
        resp.end(data);
    });
});

var onlineUsers = {};
var onlineCount = 0;
var roomMap = new Map();
var users = new Map();
var roomId = 1;

var roomInfo = []

// Do the Socket.IO magic:
var io = socketio.listen(server);
io.sockets.on("connection", function(socket){
    // This callback runs when a new Socket.IO connection is established.
    
    socket.on('message_to_server', function(data) {
        // This callback runs when the server receives a new message from the client.
        
        console.log("message: "+data["message"]); // log it to the Node.JS output
        io.sockets.emit("message_to_client",{message:data["message"] }) // broadcast the message to other users
    });

    //listen the socket disconnection
    socket.on('disconnect', function() {
        if(onlineUsers.hasOwnProperty(socket.id)) {
            var obj = {username:onlineUsers[socket.id]};

            delete onlineUsers[socket.id];
            onlineCount--;
            roomMap.forEach(function(value, key, map) {
                if(value[4] === socket.id) {
                    value[4] = '';
                }
                if(value[5] === socket.id) {
                    value[5] = '';
                }
                if(!value[4] && !value[5]) {
                    map.delete(key);
                }
            });
            io.sockets.emit('left', {onlineUsers:onlineUsers, onlineCount:onlineCount, roomList:JSON.stringify(Array.from(roomMap))});
            console.log(obj.username+'logout');
        }
    });

    socket.on('logout', function() {
        if(onlineUsers.hasOwnProperty(socket.id)) {
            var obj = {username:onlineUsers[socket.id]};

            delete onlineUsers[socket.id];
            onlineCount--;
            roomMap.forEach(function(value, key, map) {
                if(value[4] === socket.id) {
                    value[4] = '';
                }
                if(value[5] === socket.id) {
                    value[5] = '';
                }
                if(!value[4] && !value[5]) {
                    map.delete(key);
                }
            });
            io.sockets.emit('left', {onlineUsers:onlineUsers, onlineCount:onlineCount, roomList:JSON.stringify(Array.from(roomMap))});
            console.log(obj.username+'logout');
        }
    });



    socket.on('login', function(obj) {
        socket.id = obj.uid;
        console.log(users);
        if (users.has(obj.username)) {
            let user = users.get(obj.username);
            if(obj.passWord === user[1]) {
                if(!onlineUsers.hasOwnProperty(obj.uid)) {
                    onlineUsers[obj.uid] = obj.username;
                    onlineCount ++;
                }
                socket.emit("login_msg", {check:true, roomList:JSON.stringify(Array.from(roomMap))});
                io.sockets.emit("update-users", {onlineUsers:onlineUsers});
            } else {
                socket.emit("login_msg",{check:false,message:"Wrong password"});
            }
        }else{
            socket.emit("login_msg",{check:false,message:"No such user"});
        }
    });

    socket.on('register', function(obj) {
        socket.id = obj.uid;

        if (users.has(obj.username)) {
            socket.emit("register_msg",{check:false, message:"duplicated username"});
        }else{
            let user =  [obj.username,obj.passWord, 0,0];
            users.set(obj.username, user);
            if(!onlineUsers.hasOwnProperty(obj.uid)) {
                onlineUsers[obj.uid] = obj.username;
                onlineCount ++;
            }
            socket.emit("register_msg",{check:true, roomList:JSON.stringify(Array.from(roomMap))});
            io.sockets.emit("update-users", {onlineUsers:onlineUsers});
        }

    });

    socket.on('create-room', function(obj) {

        //define the roomInfo is an array Including : roomID, roomName, isPri, roomPass, player1, player2, roomStatus
        var roomInfo = [roomId, obj.roomName, obj.isPri, obj.roomPass, obj.uid, '', 'waiting'];
        roomMap.set(roomId, roomInfo);
        console.log(onlineUsers[obj.uid] + " created a new room: " + roomId);
        roomId ++;
        socket.emit('create-room-res', {roomInfo: roomInfo});
        io.sockets.emit('update-rooms', {roomList:JSON.stringify(Array.from(roomMap))});
    });

    socket.on('join-room', function(obj) {
        var roomInfo = roomMap.get(obj.roomId);
        var v = true;
        if(obj.roomPass !== roomInfo[3]) {
            socket.emit('join-room-res', {check: false, message: "the room password is wrong"});
        } else if(roomInfo[4] && roomInfo[5]) {
            socket.emit('join-room-res', {check: false, message: "There have already been two people in this room"});
        } else {
            if(!roomInfo[4]) {
                roomInfo[4] = obj.uid;
            } else {
                roomInfo[5] = obj.uid;
            }
            socket.emit('join-room-res', {check: true, roomInfo: roomInfo});
            roomMap.set(obj.roomId,roomInfo);
            console.log(onlineUsers[obj.uid] + " joined the room " + obj.roomId);
            io.sockets.emit('update-rooms', {roomList:JSON.stringify(Array.from(roomMap))});
        }
    });

    socket.on('getInfo', function(obj) {
        console.log('getInfo');
        var roomInfo = obj.roomInfo;
        let player1 = [];
        let player2 = [];
        if(roomInfo[4]) {
            var p = users.get(onlineUsers[roomInfo[4]]);
            player1 = [p[0], p[2],p[3]];
            console.log(player1);
        }
        if(roomInfo[5]) {
            var p = users.get(onlineUsers[roomInfo[5]]);
            player2 = [p[0], p[2],p[3]];
            console.log(player1);
        }
        var roomId = roomInfo[0];


        socket.join(roomId, function () {
            console.log(socket.id + " now in rooms ", socket.rooms);
        });
        io.sockets.in(roomId).emit('send-room-info', {player1:player1, player2: player2});
    });

    socket.on('getReady', function(obj) {
        var roomId = obj.roomId;
        var isMyX = obj.isMyX;
        console.log(isMyX);
        if(isMyX) {
            io.sockets.in(roomId).emit('sendReady', {ready:0});
        }else {
            io.sockets.in(roomId).emit('sendReady', {ready:1});
        }
    });

    socket.on('sendStep', function(obj) {
        var roomId = obj.roomId;
        var squares = obj.squares;
        console.log(squares);
        socket.broadcast.to(roomId).emit('nextStep', {squares:squares});
    });

    socket.on('oneGameResult', function(obj) {
        var roomId = obj.roomId;
        var player1 = obj.player1;
        var player2 = obj.player2;
        io.sockets.in(roomId).emit('oneGameResultRes', {player1:player1, player2:player2} );
    });

    socket.on('quitGame', function(obj) {
        console.log('quit');
        var roomId = obj.roomId;

        var player1 = obj.player1;

        var player2 = obj.player2;

        var roomInfo = obj.roomInfo;

        var username = obj.username;

        let leftPerson= '';
        if(player1 && username == player1[0]) {
            leftPerson = 'player1';
            roomInfo[4]= '';
        }else if(player2 && username == player2[0]) {
            leftPerson = 'player2';
            roomInfo[5]= '';
        }
        console.log(roomInfo);
        io.sockets.in(roomId).emit('onePlayerLeft', {leftPerson:leftPerson, roomInfo:roomInfo} );

        roomMap.set(roomId,roomInfo);
        roomMap.forEach(function(value, key, map) {
           if(value[4] === socket.id) {
                    value[4] = '';
            }
            if(value[5] === socket.id) {
                value[5] = '';
            }
            if(!value[4] && !value[5]) {
                map.delete(key);
            }
        });
        socket.leave(roomId);

    });

    socket.on('returnToLobby', function(obj) {
        socket.emit('goLobby',{uid:obj.uid});
        io.sockets.emit('update-rooms', {roomList:JSON.stringify(Array.from(roomMap))});
    });

});

server.listen(3300, function(err) {
    console.log('Listening at *:3300');
})