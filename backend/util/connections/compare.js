const keypointData = {};
const similarity = require('compute-cosine-similarity');

// Cosine similarity as a distance function. The lower the number, the closer // the match
// poseVector1 and poseVector2 are a L2 normalized 34-float vectors (17 keypoints each  
// with an x and y. 17 * 2 = 34)
function cosineDistanceMatching(poseVector1, poseVector2) {
  let cosineSimilarity = similarity(poseVector1, poseVector2);
  let distance = 2 * (1 - cosineSimilarity);
  return Math.sqrt(distance);
}

module.exports = async (io, client) => {
  // Create room between two users
  client.on('joinRoom', roomId => {
    client.join(roomId);
    if (!keypointData[roomId]) {
      keypointData[roomId] = {};
    };
    keypointData[roomId][client.id] = {
      keypoints: {},
      done: false
    }
  });

  // Receive skeletons on an exercise for comparison
  client.on('sendKeypoints', data => {
    console.log('keypoints sent');
    //console.log(data);
    keypointData[data.roomId][client.id].keypoints = data.keypoints;
    keypointData[data.roomId][client.id].done = true;
    console.log(keypointData);
    // check if both values in the current room are true
    let done = true;
    const keypoints = Object.values(keypointData[data.roomId])
    if (keypoints.length === 2) {
      keypoints.forEach((data) => {
        if (data.done === false) {
          done = false;
          console.log('not done but theres two :(')
        }
      });

      // Calculate the score because we're done
      if (done) {
        console.log('done!!!!');

        // Reset the keypoints to say both are not done
        keypoints.forEach((data) => {
          data.done = false;
        });
        const keypoint1 = keypoints[0].keypoints;
        const keypoint2 = keypoints[1].keypoints;

        // TODO: Compare keypoints1 and keypoints2 to generate a score
        confidenceScore = 0;

        const poseVector1 = [];
        const poseVector2 = []; 

        for (let part of keypoint1) {
          poseVector1.push(part.position.x)
          poseVector1.push(part.position.y)
        }

        for (let part of keypoint2) {
          poseVector2.push(part.position.x)
          poseVector2.push(part.position.y)
        }

        confidenceScore = cosineDistanceMatching(poseVector1, poseVector2);
        console.log("confidence: ", confidenceScore);

        client.to(data.roomId).emit('confidenceScore', confidenceScore);
      }
    }
  });
};