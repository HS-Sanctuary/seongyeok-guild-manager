// app/api/analyze-item/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: 'API 키가 없습니다.' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    // 최신 멀티모달 모델 사용
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `
      너는 마비노기 모바일 인게임 아이템 분석기야. 첨부된 스크린샷을 분석해서 오직 JSON 형태로만 대답해.
      스크린샷에는 아이템 이름, 장비 등급(예: 에픽, 엘리트, 노말 등), 그리고 염색 파트의 색상 HEX 코드(#000000)들이 나와 있어.
      반드시 아래 JSON 형식으로만 답해줘. 마크다운이나 다른 텍스트는 절대 쓰지 마.
      {
        "itemName": "아이템 이름",
        "rarity": "에픽 또는 엘리트 등급",
        "dyeParts": ["#2E2725", "#3D4144", "#F2F2E8"] (여기에 발견된 HEX 코드 배열, 없으면 빈 배열)
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64.split(',')[1], mimeType: "image/png" } }
    ]);

    const text = result.response.text();
    // JSON 파싱을 위해 불필요한 마크다운 백틱 제거
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const itemData = JSON.parse(cleanedText);

    return NextResponse.json(itemData);
  } catch (error) {
    console.error("AI 분석 에러:", error);
    return NextResponse.json({ error: '분석 실패' }, { status: 500 });
  }
}