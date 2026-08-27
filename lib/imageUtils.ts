export const autoTrimCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minX = width, minY = height, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 15) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return canvas;

  const p = 4;
  minX = Math.max(0, minX - p);
  minY = Math.max(0, minY - p);
  maxX = Math.min(width - 1, maxX + p);
  maxY = Math.min(height - 1, maxY + p);

  const trimmedWidth = maxX - minX + 1;
  const trimmedHeight = maxY - minY + 1;

  const trimmedCanvas = document.createElement("canvas");
  trimmedCanvas.width = trimmedWidth;
  trimmedCanvas.height = trimmedHeight;
  const trimmedCtx = trimmedCanvas.getContext("2d");

  if (trimmedCtx) {
    trimmedCtx.drawImage(
      canvas,
      minX, minY, trimmedWidth, trimmedHeight,
      0, 0, trimmedWidth, trimmedHeight
    );
  }

  return trimmedCanvas;
};

export const processImageCutout = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        if (!ctx) { resolve(e.target?.result as string); return; }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const visited = new Uint8Array(width * height);

        const isWhite = (r: number, g: number, b: number) => r > 220 && g > 220 && b > 220;
        const queue: number[] = [];

        for (let x = 0; x < width; x++) {
          queue.push(x, 0);
          queue.push(x, height - 1);
        }
        for (let y = 0; y < height; y++) {
          queue.push(0, y);
          queue.push(width - 1, y);
        }

        while (queue.length > 0) {
          const cy = queue.pop()!;
          const cx = queue.pop()!;
          const idx = cy * width + cx;

          if (visited[idx]) continue;
          visited[idx] = 1;

          const pixelIdx = idx * 4;
          if (isWhite(data[pixelIdx], data[pixelIdx + 1], data[pixelIdx + 2])) {
            data[pixelIdx + 3] = 0;

            if (cx > 0) queue.push(cx - 1, cy);
            if (cx < width - 1) queue.push(cx + 1, cy);
            if (cy > 0) queue.push(cx, cy - 1);
            if (cy < height - 1) queue.push(cx, cy + 1);
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const trimmedCanvas = autoTrimCanvas(canvas);
        resolve(trimmedCanvas.toDataURL("image/png", 0.9));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};