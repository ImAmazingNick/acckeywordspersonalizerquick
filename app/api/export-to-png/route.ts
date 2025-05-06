import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Create a cache for the browser instance to improve performance
let browserInstance: Browser | null = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data = await request.json();
    const { elementId, html, styles, windowWidth, windowHeight, fileName } = data;

    // Create a temporary file to store the HTML
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `${Date.now()}.html`);
    
    // Create HTML with embedded styles
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Export</title>
          <style>
            ${styles.join('\n')}
            
            /* Additional fixes for export */
            body { margin: 0; padding: 0; background: white; }
            * { box-sizing: border-box; }
            
            /* Ensure colors are preserved */
            .bg-emerald-50 { background-color: #f0fdf4 !important; }
            .bg-amber-50 { background-color: #fffbeb !important; }
            .bg-rose-50 { background-color: #fff1f2 !important; }
            
            /* Border styles */
            .border-purple-200 { border-color: #e9d5ff !important; }
            .border-purple-300 { border-color: #d8b4fe !important; }
            .border-l-3 { border-left-width: 3px !important; }
            .border-r-3 { border-right-width: 3px !important; }
            
            /* Badge colors */
            .bg-emerald-100 { background-color: #dcfce7 !important; }
            .text-emerald-800 { color: #166534 !important; }
            .border-emerald-400 { border-color: #4ade80 !important; }
            
            .bg-amber-100 { background-color: #fef3c7 !important; }
            .text-amber-800 { color: #92400e !important; }
            .border-amber-400 { border-color: #fbbf24 !important; }
            
            .bg-rose-100 { background-color: #ffe4e6 !important; }
            .text-rose-800 { color: #9f1239 !important; }
            .border-rose-400 { border-color: #fb7185 !important; }
            
            .bg-slate-100 { background-color: #f1f5f9 !important; }
            .text-slate-800 { color: #1e293b !important; }
            .border-slate-400 { border-color: #94a3b8 !important; }
            
            /* Table styles */
            .bg-purple-900 { background-color: #581c87 !important; }
            .text-white { color: #ffffff !important; }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
    
    // Write the HTML to the temporary file
    fs.writeFileSync(tempFile, styledHtml);

    // Get the browser instance
    const browser = await getBrowser();
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set viewport size to match the client's window
    await page.setViewport({ 
      width: windowWidth || 1200, 
      height: windowHeight || 800, 
      deviceScaleFactor: 2 
    });
    
    // Navigate to the temporary file
    await page.goto(`file://${tempFile}`, { waitUntil: 'networkidle0' });
    
    // Wait a moment for any animations/styles to apply
    await page.waitForTimeout(500);
    
    // Find the element by ID
    const element = await page.$(`#${elementId}`);
    
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found in the page`);
    }
    
    // Take a screenshot of just that element
    const screenshot = await element.screenshot({
      type: 'png',
      omitBackground: false
    });
    
    // Close the page
    await page.close();
    
    // Remove the temporary file
    fs.unlinkSync(tempFile);
    
    // Return the screenshot as a response
    return new NextResponse(screenshot, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${fileName}-${new Date().toISOString().slice(0, 10)}.png"`
      }
    });
  } catch (error) {
    console.error('Error in export-to-png API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 