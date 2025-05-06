import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

/**
 * Direct export method using html2canvas - simpler approach for production
 */
const exportTableWithSimpleMethod = async (element: HTMLElement, fileName: string): Promise<void> => {
  // Simple direct rendering with minimal options, focusing on the actual content
  console.log('Using simple direct export method');
  
  // Set a white background to ensure visibility
  const originalBackground = element.style.background;
  element.style.background = '#ffffff';
  
  try {
    // Simple, direct capture of the element
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: true,
      // No foreignObjectRendering to avoid cross-origin issues
      // No complex cloning that might break
    });
    
    // Save the image directly
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${fileName}-${new Date().toISOString().slice(0, 10)}.png`);
      } else {
        throw new Error('Failed to create blob from canvas');
      }
    }, 'image/png', 0.95);
  } finally {
    // Restore the original background
    element.style.background = originalBackground;
  }
};

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

    console.log(`Found element for export: ${elementId}, width: ${element.offsetWidth}, height: ${element.offsetHeight}`);
    
    // Check if we're on Vercel production - use the simplest method possible
    const isProduction = window.location.hostname.includes('vercel') || 
                        window.location.hostname.includes('improvado.dev');
    
    if (isProduction) {
      console.log('Detected production environment, using simple export method');
      
      // Find the actual table within the container - gives better results in production
      const tableElement = element.querySelector('.results-table-wrapper') || element;
      return await exportTableWithSimpleMethod(tableElement as HTMLElement, fileName);
    }

    // First attempt: Try to use the server API with Puppeteer for better quality
    if (!process.env.NEXT_PUBLIC_HTML2CANVAS_ONLY) {
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
    }

    // Fallback: Use html2canvas directly in the browser
    console.log('Using html2canvas fallback for export');
    
    // Ensure the element is visible and has proper dimensions
    const originalDisplay = element.style.display;
    const originalVisibility = element.style.visibility;
    const originalPosition = element.style.position;
    const originalOpacity = element.style.opacity;
    
    // Make element fully visible for capture
    element.style.visibility = 'visible';
    element.style.display = 'block';
    element.style.position = 'relative';
    element.style.opacity = '1';
    
    // Create a clone of the table for more accurate capture
    const tableWrapper = document.createElement('div');
    tableWrapper.style.position = 'absolute';
    tableWrapper.style.top = '-9999px';
    tableWrapper.style.left = '-9999px';
    tableWrapper.style.width = `${element.offsetWidth}px`;
    tableWrapper.style.height = `${element.offsetHeight}px`;
    tableWrapper.style.background = '#ffffff';
    tableWrapper.style.padding = '20px';
    tableWrapper.style.zIndex = '-1';
    
    // Clone the element for capturing
    const clonedElement = element.cloneNode(true) as HTMLElement;
    tableWrapper.appendChild(clonedElement);
    document.body.appendChild(tableWrapper);
    
    try {
      console.log('Starting html2canvas capture...');
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        logging: true, // Enable logging for debugging
        backgroundColor: '#ffffff',
        allowTaint: true,
        foreignObjectRendering: true,
        onclone: (documentClone) => {
          console.log('html2canvas cloned document');
          // Force all styles to be computed in the clone
          const clonedElementInDoc = documentClone.getElementById(elementId);
          if (clonedElementInDoc) {
            // Apply inline styles to maintain visual appearance
            const computedStyle = window.getComputedStyle(element);
            Array.from(computedStyle).forEach(key => {
              (clonedElementInDoc as HTMLElement).style.setProperty(
                key, 
                computedStyle.getPropertyValue(key), 
                computedStyle.getPropertyPriority(key)
              );
            });
          }
        }
      });
      
      console.log(`Canvas created: ${canvas.width}x${canvas.height}`);
      
      // Convert canvas to blob with high quality
      canvas.toBlob((blob) => {
        if (blob) {
          const blobSize = blob.size;
          console.log(`Blob created: ${blobSize} bytes`);
          saveAs(blob, `${fileName}-${new Date().toISOString().slice(0, 10)}.png`);
        } else {
          console.error('Failed to create blob from canvas');
        }
      }, 'image/png', 1.0);
    } finally {
      // Clean up - restore original element styles
      element.style.display = originalDisplay;
      element.style.visibility = originalVisibility;
      element.style.position = originalPosition;
      element.style.opacity = originalOpacity;
      
      // Remove the temporary wrapper
      if (document.body.contains(tableWrapper)) {
        document.body.removeChild(tableWrapper);
      }
    }
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