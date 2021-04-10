module.exports = async (io, client) => {
  client.on('bpm', data => io.to('instructor').emit('bpm', data));
};