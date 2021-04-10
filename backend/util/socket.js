const { Server } = require('socket.io');
const compare = require('./connections/compare');
const bpm = require('./connections/bpm');

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*' // enable CORS for sockets
        }
    });

    io.on('connection', client => {
        compare(io, client); // Comparison score between users
        bpm(io, client); // Heart rate information between users
    });
};
