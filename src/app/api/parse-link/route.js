// src/app/api/parse-link/route.js
import { NextResponse } from 'next/server';
import { load } from 'cheerio';

export async function POST(request) {
  try {
    const { url } = await request.json();

    // Fetch HTML dari URL yang diberikan
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const html = await response.text();
    const $ = load(html);

    // Parse meta tags
    const name = $('meta[property="og:title"]').attr('content') || '';
    const imageURL = $('meta[property="og:image"]').attr('content') || '';
    const description = $('meta[property="og:description"]').attr('content') || '';

    return NextResponse.json({
      success: true,
      data: { name, imageURL, description }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}