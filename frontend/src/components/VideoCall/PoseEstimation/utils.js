export const angle = (P1, P2, P3) => {
  const a = Math.sqrt((P1.x - P2.x)**2 + (P1.y - P2.y)**2);
  const b = Math.sqrt((P3.x - P2.x)**2 + (P3.y - P2.y)**2);
  const c = Math.sqrt((P1.x - P3.x)**2 + (P1.y - P3.y)**2);
  const ang = Math.acos((a**2 +b**2-c**2)/(2*a*b));
  const deg = ang/(Math.PI / 180);
  return deg;
}

export const checkSquatStanding = (angle) => angle > 65 && angle < 100;
export const checkSquatDown = (angle) => angle > 135;

export const checkCurlRest = (angle) => angle > 125 || angle < 20; 
export const checkCurlActive = (angle) => angle < 70 && angle > 20;

export const average = (listOfNums) => listOfNums.reduce((acc, val) => {
  acc += val;
  return acc;
}, 0)/listOfNums.length;


export const isSquatPosition = (keypoints) => {
  // check if upper body is square --> squat position
  let leftSide = [keypoints["leftHip"], keypoints["leftShoulder"], keypoints["rightShoulder"]]
  let rightSide = [keypoints["leftHip"], keypoints["rightHip"], keypoints["rightShoulder"]]

  leftSide = leftSide.filter((x) => x);
  rightSide = rightSide.filter((x) => x);

  if (leftSide.length !== 3 || rightSide.length !== 3) {
    return false;
  }

  const leftSideAngle = angle(leftSide[0], leftSide[1], leftSide[2]);
  const rightSideAngle = angle(rightSide[0], rightSide[1], rightSide[2]);

  // make sure they're about right angle
  if (leftSideAngle > 100 || leftSideAngle < 80 || rightSideAngle > 100 || rightSideAngle < 80) {
    return false; 
  }

  return true;
}

export const isCurlPosition = (keypoints) => {
  // left/right shoulder are short distance, since user will be sitting from the side
  const leftShoulder = keypoints["leftShoulder"];
  const rightShoulder = keypoints["rightShoulder"];

  if (!leftShoulder || !rightShoulder) {
    return false; 
  }

  return Math.abs(leftShoulder.x - rightShoulder.x) < 50;
};

export const isStanding = (keypoints) => {
  const leftKnee = keypoints["leftKnee"]
  const leftHip = keypoints["leftHip"]

  const rightKnee = keypoints["rightKnee"]
  const rightHip = keypoints["rightHip"]

  if (!leftKnee || !leftHip || !rightKnee || !rightHip) {
    return false; 
  }

  return Math.abs(rightKnee.position.y - rightHip.position.y) > 20 || Math.abs(leftKnee.position.y - leftHip.position.y) > 20;
}

export const isSitting = (keypoints) => {
  const leftKnee = keypoints["leftKnee"]
  const leftHip = keypoints["leftHip"]

  const rightKnee = keypoints["rightKnee"]
  const rightHip = keypoints["rightHip"]

  let dist1 = rightKnee && rightHip ? Math.abs(rightKnee.position.y - rightHip.position.y) : 0; 
  let dist2 = leftKnee && leftHip ? Math.abs(leftKnee.position.y - leftHip.position.y) : 0; 

  if (dist1 === 0 && dist2 === 0) {
    return false;
  }

  return dist1 < 20 || dist2 < 20;  
}