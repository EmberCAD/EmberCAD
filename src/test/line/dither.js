// Convert an image to pattern using Jarvis or Stucki algorithm
function convertImageToPattern(imageData, algorithm, grayscale = false) {
  // Helper functions to get/set pixel values
  function getPixel(imageData, x, y) {
    const index = (y * imageData.width + x) * 4;
    return {
      r: imageData.data[index],
      g: imageData.data[index + 1],
      b: imageData.data[index + 2],
      a: imageData.data[index + 3],
    };
  }

  function setPixel(imageData, x, y, pixel) {
    const index = (y * imageData.width + x) * 4;
    imageData.data[index] = pixel.r;
    imageData.data[index + 1] = pixel.g;
    imageData.data[index + 2] = pixel.b;
    imageData.data[index + 3] = pixel.a;
  }

  const width = imageData.width;
  const height = imageData.height;

  // Create a copy of the original image data
  const resultData = new Uint8ClampedArray(imageData.data);

  // Convert the image to grayscale if the flag is set to true
  if (grayscale) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel = getPixel(imageData, x, y);
        const grayValue = Math.round(0.2989 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b);
        const newPixel = { r: grayValue, g: grayValue, b: grayValue, a: pixel.a };
        setPixel(imageData, x, y, newPixel);
      }
    }
  }

  // Define the error propagation matrix based on the selected algorithm
  let errorPropagationMatrix;
  if (algorithm === 'jarvis') {
    errorPropagationMatrix = [
      [0, 0, 0, 7, 5],
      [3, 5, 7, 5, 3],
      [1, 3, 5, 3, 1],
    ];
  } else if (algorithm === 'stucki') {
    errorPropagationMatrix = [
      [0, 0, 0, 8, 4],
      [2, 4, 8, 4, 2],
      [1, 2, 4, 2, 1],
    ];
  } else {
    throw new Error('Unsupported algorithm.');
  }

  // Apply dithering to each pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const oldPixel = getPixel(imageData, x, y);
      const newPixel = {
        r: oldPixel.r < 128 ? 0 : 255,
        g: oldPixel.g < 128 ? 0 : 255,
        b: oldPixel.b < 128 ? 0 : 255,
        a: oldPixel.a,
      };
      setPixel(imageData, x, y, newPixel);

      const quantError = {
        r: oldPixel.r - newPixel.r,
        g: oldPixel.g - newPixel.g,
        b: oldPixel.b - newPixel.b,
      };

      // Distribute the quantization error to neighboring pixels
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height) {
            const errorFactor = errorPropagationMatrix[1 + dy][2 + dx] / 48;
            const neighborPixel = getPixel(imageData, x + dx, y + dy);
            const correctedPixel = {
              r: Math.max(0, Math.min(255, neighborPixel.r + quantError.r * errorFactor)),
              g: Math.max(0, Math.min(255, neighborPixel.g + quantError.g * errorFactor)),
              b: Math.max(0, Math.min(255, neighborPixel.b + quantError.b * errorFactor)),
              a: neighborPixel.a,
            };
            setPixel(imageData, x + dx, y + dy, correctedPixel);
          }
        }
      }
    }
  }

  return resultData;
}
