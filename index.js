const express = require('express');
const app = express();
const fs = require('node:fs');

const options = {
    key: fs.readFileSync('localhost.key'),
    cert: fs.readFileSync('localhost.crt'),
};

const https = require('https');
const server = https.createServer(options, app);
const port = process.env.PORT || 443;

app.use(express.static('public'));
server.listen(port, () => {
    console.log(`App listening on port ${port}!`);
});

const { Server } = require('socket.io');
const io = new Server(server);

const clients = {};
io.on('connection', socket => {
    clients[socket.id] = { id: socket.id };
    console.log('Socket connected', socket.id);

    socket.on('disconnect', () => {
        delete clients[socket.id];
        io.emit('clients', clients);
    });

    socket.on('startGame', (targetSocketId) => {
        if (!clients[targetSocketId]) {
            return;
        }
        io.to(targetSocketId).emit(`startGame`);
    });

    socket.on('endGame', (targetSocketId) => {
        if (!clients[targetSocketId]) {
            return;
        }
        io.to(targetSocketId).emit('endGame');
    });

    socket.on('orientationUpdate', (targetSocketId, data) => {
        if (!clients[targetSocketId]) {
            return;
        }
        clients[socket.id].degrees = data.degrees;
        io.to(targetSocketId).emit('orientationUpdate', data);
    });

    socket.on('clickingUpdate', (targetSocketId) => {
        if (!clients[targetSocketId]) {
            return;
        }
        io.to(targetSocketId).emit('clickingUpdate');
    });

    socket.on('disconnect', () => {
        delete clients[socket.id];
    });

});