// circle.strokeWidth = 2;
const fillGroup = new paper.Group();
for (let i = 0; i < 5; i++) {
  const box = new paper.Path.Rectangle(100, 100 + i * 40, 200, 20);
  box.strokeColor = 'yellow';
  box.strokeWidth = 1;
  fillGroup.addChild(box);
}
let result = fillGroup.children[0];

for (let i = 0; i < 5; i++) {
  var nextPath = fillGroup.children[i];
  result = result.unite(nextPath);
  nextPath.remove();
}

// console.log(result.bounds);

const circle = new paper.Path.Circle([200, 200], 80);
circle.fillColor = 'white';

circle.clipMask = true;
// // // fillGroup.children[5].subtract(circle);
// result = result.intersect(circle);
// result.position = [500, 500];

// console.log(result);
