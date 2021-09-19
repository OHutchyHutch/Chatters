const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');


const app = express(path.join(__dirname, 'public'));
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static("public"));
const botName = 'Chatters';
//Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        // Welcome current user
        socket.emit('message', formatMessage(botName,`Welcome to Chatters, ${user.username}!`));

        // Broadcast that user has joined
        socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${user.username} has joined the room!`));

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })

    //Listen for chatMessages
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg))
    });
    
    // Broadcast that user has left
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(botName,`A ${user.username} has left the chat!`))

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }
    })
});

server.listen(process.env.PORT || 3030, () =>
    console.log("Server running on " + process.env.PORT + " or 3030")
);