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

const average = (listOfNums) => listOfNums.reduce((acc, val) => {
  acc += val;
  return acc;
}, 0)/listOfNums.length;


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
    if (keypointData[data.roomId] && keypointData[data.roomId][client.id]) {
    keypointData[data.roomId][client.id].keypoints = data.keypoints;
    keypointData[data.roomId][client.id].done = true;
    console.log(JSON.stringify(keypointData));
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
        // confidenceScore = 0;

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

        // Cosine 
        const confidenceScore = 100 - cosineDistanceMatching(poseVector1, poseVector2);
        console.log("confidence: ", confidenceScore);

        /*
        const keypointMap1 = {}, keypointMap2 = {}; 
        for (let bodyPart of keypoint1) {
          keypointMap1[bodyPart.part] = bodyPart;
        }
        for (let bodyPart of keypoint2) {
          keypointMap2[bodyPart.part] = bodyPart;
        }

        // Squat
        if (data.exerciseType && data.exerciseType === "squat") {
          // Compare angles of the body parts

          // person1 
          const left1 = angle(keypointMap1["leftKnee"].position, keypointMap1["leftHip"].position, keypointMap1["rightHip"].position);
          const right1 = angle(keypointMap1["rightKnee"].position, keypointMap1["rightHip"].position, keypointMap1["leftHip"].position);

          // person2 
          const left2 = angle(keypointMap2["leftKnee"].position, keypointMap2["leftHip"].position, keypointMap2["rightHip"].position);
          const right2 = angle(keypointMap2["rightKnee"].position, keypointMap2["rightHip"].position, keypointMap2["leftHip"].position);

          // our "math"
          let leftDiff = Math.abs(left1 - left2);
          if (leftDiff < 1) {
            leftDiff = 1;
          }

          let rightDiff = Math.abs(right1 - right2);
          if (rightDiff < 1) {
            rightDiff = 1;
          }

          // TODO: maybe use this to generate insights?
        }

        // Curl 
        if (data.exerciseType && data.exerciseType === "curl") {
          // Compare angles of the body parts

          // person1 
          const left1 = angle(keypointMap1["leftShoulder"].position, keypointMap1["leftElbow"].position, keypointMap1["leftWrist"].position);
          const right1 = angle(keypointMap1["rightShoulder"].position, keypointMap1["rightElbow"].position, keypointMap1["rightWrist"].position);

          // person2 
          const left2 = angle(keypointMap2["leftShoulder"].position, keypointMap2["leftElbow"].position, keypointMap2["leftWrist"].position);
          const right2 = angle(keypointMap2["rightShoulder"].position, keypointMap2["rightElbow"].position, keypointMap2["rightWrist"].position);

          // our "math"
          let leftDiff = Math.abs(left1 - left2);
          if (leftDiff < 1) {
            leftDiff = 1;
          }

          let rightDiff = Math.abs(right1 - right2);
          if (rightDiff < 1) {
            rightDiff = 1;
          }

          // breakdown of final score: 10% cosine + 90% angles
          confidenceScore = (45*(1/leftDiff)) + (45*(1/rightDiff)) + (.1*(cosineSimilarity))
        }
        */
        client.nsp.to(data.roomId).emit('confidenceScore', confidenceScore);
      }
      }
    }
  });
};