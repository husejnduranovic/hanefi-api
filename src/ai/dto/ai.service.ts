// src/ai/ai.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

type ReviewResult = {
  corrected_markdown: string;
  summary: string;
  title_suggestion: string;
  slug_suggestion: string;
  keywords?: string[];
  image_prompt: string;
};

@Injectable()
export class AiService {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async reviewArticle(content: string, lang: 'bs' | 'hr' | 'sr' | 'en' = 'bs') {
    // 1) Tekst → JSON (Structured Outputs)
    const resp = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            `You are an expert ${lang.toUpperCase()} copy editor. ` +
            `Correct grammar and style while preserving meaning and tone. ` +
            `Do not fabricate facts. Keep religious terms and diacritics.`,
        },
        {
          role: 'user',
          content:
            `Original article content (${lang}):\n\n${content}\n\n` +
            `Tasks:\n` +
            `1) corrected_markdown (markdown allowed).\n` +
            `2) summary: 1–3 sentences.\n` +
            `3) title_suggestion (concise), slug_suggestion (latin-lower-hyphens).\n` +
            `4) keywords: 3–5 terms.\n` +
            `5) image_prompt in EN for a tasteful hero image (no text, no logos, no faces).\n` +
            `Respond in the following JSON format:\n` +
            `{\n` +
            `  "corrected_markdown": "...",\n` +
            `  "summary": "...",\n` +
            `  "title_suggestion": "...",\n` +
            `  "slug_suggestion": "...",\n` +
            `  "keywords": ["...", "...", "..."],\n` +
            `  "image_prompt": "..." \n` +
            `}`,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    // SDK v5 ima helper:
    // @ts-ignore
    const jsonText = resp.output_text as string;
    let parsed: ReviewResult;
    try {
      parsed = JSON.parse(jsonText) as ReviewResult;
    } catch {
      throw new InternalServerErrorException('AI parsing error');
    }

    // 2) Generisanje slike (fokus na kvalitet — zasebni Images API)
    const img = await this.client.images.generate({
      model: 'gpt-image-1',
      prompt: parsed.image_prompt,
      size: '1024x1024', // 16:9 hero
      n: 1,
      // transparent_background: false, // po potrebi (ako želiš PNG s alfa: true)
    });
    const b64 = img.data ? (img.data[0]?.b64_json ?? null) : null;

    // Vraćamo sve bez unutrašnjeg image_prompt
    return {
      corrected_markdown: parsed.corrected_markdown,
      summary: parsed.summary,
      title_suggestion: parsed.title_suggestion,
      slug_suggestion: parsed.slug_suggestion,
      keywords: parsed.keywords ?? [],
      image_base64: b64,
    };
  }
}
