const MAX_BYTES = 350 * 1024;

export async function compressReportImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size > 12 * 1024 * 1024) {
    throw new Error("12MB 이하의 사진 파일만 첨부할 수 있습니다.");
  }
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000) {
      throw new Error("사진 해상도가 너무 큽니다. 더 작은 사진을 선택해 주세요.");
    }
    for (const edge of [1600, 1280, 1024, 800]) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("사진을 처리할 수 없습니다.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.82, 0.7, 0.58, 0.46]) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
        if (blob?.type === "image/webp" && blob.size <= MAX_BYTES) {
          return new File([blob], "report.webp", { type: "image/webp" });
        }
      }
    }
  } finally {
    bitmap.close();
  }
  throw new Error("사진을 350KB 이하로 줄일 수 없습니다. 더 작은 사진을 선택해 주세요.");
}
