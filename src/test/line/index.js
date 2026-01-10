let data, imageData;
function plot(x, y, R, G, B, A, ctx) {
  // Get the canvas context
  // const canvas = document.getElementById('myCanvas');
  // const ctx = canvas.getContext('2d');
  // Get the imageData object
  if (!data) {
    imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    data = imageData.data;
  }
  // Calculate the index position in the data array
  const index = (y * ctx.canvas.width + x) * 4;

  // Set the RGBA values for the pixel
  data[index] = R; // Red
  data[index + 1] = G; // Green
  data[index + 2] = B; // Blue
  data[index + 3] = A; // Alpha

  // Update the canvas with the modified imageData
  ctx.putImageData(imageData, 0, 0);
}

function plotCtx(x, y, R, G, B, A, ctx) {
  // Get the canvas context

  // Set the fill color
  ctx.fillStyle = `rgba(${R}, ${G}, ${B}, ${A})`;

  // Draw a filled rectangle at the specified position
  ctx.fillRect(x, y, 1, 1);
}

function line(fromX, fromY, toX, toY, R, G, B, A, ctx) {
  // Get the canvas context
  // const canvas = document.getElementById('myCanvas');
  // const ctx = canvas.getContext('2d');

  // Calculate the differences and absolute differences between the start and end points
  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  const sx = fromX < toX ? 1 : -1;
  const sy = fromY < toY ? 1 : -1;
  let err = dx - dy;

  // Loop through the points and plot them
  while (true) {
    plot(fromX, fromY, R, G, B, A, ctx);

    if (fromX === toX && fromY === toY) {
      break;
    }

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      fromX += sx;
    }
    if (e2 < dx) {
      err += dx;
      fromY += sy;
    }
  }
}

function lineCtx(fromX, fromY, toX, toY, R, G, B, A, ctx) {
  // Get the canvas context
  // const canvas = document.getElementById('myCanvas');
  // const ctx = canvas.getContext('2d');

  // Calculate the differences and absolute differences between the start and end points
  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  const sx = fromX < toX ? 1 : -1;
  const sy = fromY < toY ? 1 : -1;
  let err = dx - dy;

  // Loop through the points and plot them
  while (true) {
    plotCtx(fromX, fromY, R, G, B, A, ctx);

    if (fromX === toX && fromY === toY) {
      break;
    }

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      fromX += sx;
    }
    if (e2 < dx) {
      err += dx;
      fromY += sy;
    }
  }
}
