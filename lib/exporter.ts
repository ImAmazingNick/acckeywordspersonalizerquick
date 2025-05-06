import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

/**
 * Export a DOM element to PNG using Puppeteer on server or html2canvas as fallback
 * @param elementId The ID of the DOM element to export
 * @param fileName Base name for the exported file
 */
export async function exportToPng(elementId: string, fileName: string): Promise<void> {
  try {
    // Get the element data and styles to send to the server
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // First attempt: Try to use the server API with Puppeteer for better quality
    try {
      // Get all stylesheets from the document
      const styleSheets = Array.from(document.styleSheets);
      const styles: string[] = [];

      // Extract CSS rules from stylesheets
      styleSheets.forEach(sheet => {
        try {
          if (sheet.cssRules) {
            const rules = Array.from(sheet.cssRules);
            rules.forEach(rule => {
              styles.push(rule.cssText);
            });
          }
        } catch (e) {
          console.warn('Could not access stylesheet rules', e);
        }
      });

      // Create a data object with the HTML content, styles, and some metadata
      const data = {
        elementId,
        html: document.documentElement.outerHTML,
        styles,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        fileName,
        timestamp: new Date().toISOString()
      };

      // Make a POST request to our API endpoint that uses Puppeteer
      const response = await fetch('/api/export-to-png', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        // Add a reasonable timeout
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`Error exporting to PNG: ${response.statusText}`);
      }

      // Get the PNG blob from the response
      const blob = await response.blob();
      
      // Use file-saver to save the blob as a PNG file
      saveAs(blob, `${fileName}-${new Date().toISOString().slice(0, 10)}.png`);
      return;
    } catch (serverError) {
      // If server-side export fails, fall back to client-side html2canvas
      console.warn('Server-side export failed, falling back to client-side export', serverError);
    }

    // Fallback: Use html2canvas directly in the browser
    console.log('Using html2canvas fallback for export');
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      foreignObjectRendering: true,
    });
    
    // Convert canvas to blob with high quality
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${fileName}-${new Date().toISOString().slice(0, 10)}.png`);
      }
    }, 'image/png', 1.0);
  } catch (error) {
    console.error('Error exporting to PNG:', error);
    throw error;
  }
}

/**
 * Export all tables for all accounts
 * @param accountIds Array of account IDs to export
 * @param accountNames Object mapping account IDs to names
 */
export async function exportAllToPng(accountIds: string[], accountNames: Record<string, string>): Promise<void> {
  try {
    // Export each account table sequentially
    for (const accountId of accountIds) {
      const elementId = `table-${accountId}`;
      const accountName = accountNames[accountId] || 'Account';
      
      await exportToPng(elementId, accountName);
      
      // Add a small delay between exports to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error('Error exporting all tables:', error);
    throw error;
  }
} 