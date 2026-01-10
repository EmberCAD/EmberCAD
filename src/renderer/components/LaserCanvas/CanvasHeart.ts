// @ts-ignore
// @ts-nocheck
function createHeart(x, y, width, height, curve) {
  // Create a Paper.js Path to represent the heart shape
  var heart = new Path();

  // Set the initial point of the Path
  heart.moveTo(new Point(x + width * 0.25, y + height * 0.5));

  // Use the cubic curveTo() method to add a curved segment to the Path
  heart.cubicCurveTo(
    new Point(x + width * 0.25, y + height * (0.5 - curve)),
    new Point(x + width * 0.75, y + height * (0.5 - curve)),
    new Point(x + width * 0.75, y + height * 0.5),
  );
  heart.cubicCurveTo(
    new Point(x + width * 0.75, y + height * (0.5 + curve)),
    new Point(x + width * 0.25, y + height * (0.5 + curve)),
    new Point(x + width * 0.25, y + height * 0.5),
  );

  // Close the Path
  heart.closed = true;

  // Set the fill color of the heart shape
  heart.fillColor = 'red';

  return heart;
}
