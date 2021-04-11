module.exports = async (io, client) => {
  client.on('setExercise', data => {
    console.log('set exercise');
    client.to(data.roomId).emit('newExercise', data.exercise);
  });
};