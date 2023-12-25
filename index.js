const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        credentials: true,
    },
});

app.use(express.static(path.join(__dirname, 'public')));

app.get("/on", async (req, res) => {
    res.send("Hello, world!");
});

// Handle socket connection
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle offers from other users
    socket.on('offer', (data) => {
        console.log('Received offer:', data);
        // Broadcast the offer to other users
        socket.broadcast.emit('offer', data);
    });

    // Handle answers from other users
    socket.on('answer', (data) => {
        console.log('Received answer:', data);
        // Broadcast the answer to other users
        socket.broadcast.emit('answer', data);
    });

    // Handle ICE candidates from other users
    socket.on('ice-candidate', (data) => {
        console.log('Received ICE candidate:', data);
        // Broadcast the ICE candidate to other users
        socket.broadcast.emit('ice-candidate', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
        // Handle cleanup or notification logic if needed
    });
});

const port = process.env.PORT || 8001;
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
