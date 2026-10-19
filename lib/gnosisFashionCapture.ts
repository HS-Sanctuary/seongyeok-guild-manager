import type { FashionLook } from './gnosisFashion';
export async function captureFashion(look:FashionLook):Promise<Blob>{
  const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1100;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('이미지를 만들 수 없어요.');
  ctx.fillStyle='#111318';ctx.fillRect(0,0,1000,1100);
  ctx.fillStyle='#e6c788';ctx.font='bold 30px sans-serif';ctx.fillText('SANCTUM · FASHION',48,65);
  ctx.fillStyle='#ffffff';ctx.font='bold 32px sans-serif';
  // Fit the complete name rather than clipping long Korean titles.
  let size=32;while(size>14&&ctx.measureText(look.item.itemName||'나의 코디').width>900){ctx.font=`bold ${--size}px sans-serif`;}
  ctx.fillText(look.item.itemName||'나의 코디',48,120);
  if(look.image){const img=new Image();img.src=look.image;await img.decode();const ratio=Math.min(904/img.width,700/img.height);ctx.drawImage(img,(1000-img.width*ratio)/2,155+(700-img.height*ratio)/2,img.width*ratio,img.height*ratio);}
  else{ctx.fillStyle='#a8adbb';ctx.font='24px sans-serif';ctx.fillText('염색 팔레트',48,210);}
  const count=look.item.dyeParts.length;
  look.item.dyeParts.forEach((color,i)=>{const x=48+(i%6)*152,y=895+Math.floor(i/6)*85;ctx.fillStyle=color;ctx.fillRect(x,y,128,36);ctx.fillStyle='#ffffff';ctx.font='18px sans-serif';ctx.fillText(color.toUpperCase(),x,y+62);});
  if(!count){ctx.fillStyle='#a8adbb';ctx.font='22px sans-serif';ctx.fillText('염색 색상 없음',48,930);}
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('이미지를 만들지 못했어요.')),'image/png'));
}
