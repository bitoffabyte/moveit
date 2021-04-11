module.exports = async (io, client) => {
  client.on('setExercise', data => {
    client.to(data.roomId).emit('newExercise', data.exercise);
  });
};