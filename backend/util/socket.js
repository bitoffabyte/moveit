const { Server } = require('socket.io');
const compare = require('./connections/compare');
const data = require('./connections/data');

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
                origin: '*' // enable CORS for sockets
        }
    });

    io.on('connection', client => {
        compare(io, client); // Comparison score between users
        data(io, client); // Transfer information between users
    });
};
