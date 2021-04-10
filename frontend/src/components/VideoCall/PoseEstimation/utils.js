export const angle = (P1, P2, P3) => {
  const a = Math.sqrt((P1.x - P2.x)**2 + (P1.y - P2.y)**2);
  const b = Math.sqrt((P3.x - P2.x)**2 + (P3.y - P2.y)**2);
  const c = Math.sqrt((P1.x - P3.x)**2 + (P1.y - P3.y)**2);
  const ang = Math.acos((a**2 +b**2-c**2)/(2*a*b));
  const deg = ang/(Math.PI / 180);
  return deg;
}

export const checkSquatStanding = (angle) => angle > 65 && angle < 100;
export const checkSquatDown = (angle) => angle > 140;