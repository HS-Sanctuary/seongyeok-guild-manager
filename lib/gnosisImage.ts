export const IMAGE_TARGET_BYTES=200*1024;
export function imageDimensions(width:number,height:number,scale=1){const ratio=Math.min(1,1000/width,1600/height)*scale;return {width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio))};}
export async function compressGnosisImage(file:File){
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('10MB 이하의 PNG/JPG/WebP 이미지를 선택해주세요.');
  const bitmap=await createImageBitmap(file);
  try {
    if(bitmap.width*bitmap.height>50000000)throw new Error('이미지 해상도가 너무 커요. 5천만 화소 이하로 줄여주세요.');
    const canvas=document.createElement('canvas');
    for(let attempt=0;attempt<9;attempt++){
      const size=imageDimensions(bitmap.width,bitmap.height,Math.pow(.82,Math.max(0,attempt-2)));
      canvas.width=size.width;canvas.height=size.height;
      const context=canvas.getContext('2d');if(!context)throw new Error('이미지 압축을 사용할 수 없어요.');
      context.drawImage(bitmap,0,0,size.width,size.height);
      const quality=Math.max(.42,.7-attempt*.08);
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('이미지를 압축하지 못했어요.')),'image/webp',quality));
      if(blob.type!=='image/webp')throw new Error('이 브라우저는 WebP 압축을 지원하지 않아요.');
      if(blob.size<=IMAGE_TARGET_BYTES){
        const src=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('압축 이미지를 읽지 못했어요.'));reader.readAsDataURL(blob);});
        return {src,width:size.width,height:size.height,originalBytes:file.size,compressedBytes:blob.size};
      }
    }
    throw new Error('200KB 이하로 줄이지 못했어요. 이미지를 잘라서 다시 첨부해주세요.');
  } finally {bitmap.close();}
}
