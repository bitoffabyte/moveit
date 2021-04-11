module.exports = async (io, client) => {
  // Create room between two users here
  io.on('joinRoom', data => {
    console.log(client.id + ' joined ' + data);
    client.join(data);
  });
};