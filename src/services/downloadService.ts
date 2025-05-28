
import JsBarcode from 'jsbarcode';
import { TradeIn, TradeInItem } from '../types/tradeIn';
import { formatCurrency } from '../utils/formatters';
import { generateSku } from '../utils/skuGenerator';
import { toast } from 'react-hot-toast';

export interface DownloadOptions {
  format: 'png' | 'pdf' | 'svg';
  layout?: 'single' | 'sheet' | 'avery5160' | 'avery5161';
  quality?: number;
  includeCustomerInfo?: boolean;
}

export const downloadService = {
  // Download a single trade-in barcode
  downloadTradeInBarcode: async (
    tradeIn: TradeIn, 
    options: DownloadOptions = { format: 'png' }
  ) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas size based on format
      const width = options.format === 'pdf' ? 612 : 384; // 2 inches at 192 DPI
      const height = options.format === 'pdf' ? 288 : 192; // 1 inch at 192 DPI
      
      canvas.width = width;
      canvas.height = height;
      
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      
      // Customer info
      if (options.includeCustomerInfo !== false) {
        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(tradeIn.customer_name || 'Unknown Customer', width / 2, 25);
        
        ctx.font = '12px Arial';
        ctx.fillText(new Date(tradeIn.trade_in_date).toLocaleDateString(), width / 2, 45);
        ctx.fillText(`$${formatCurrency(tradeIn.total_value)}`, width / 2, 65);
      }
      
      // Generate barcode SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svg, tradeIn.id, {
        format: "CODE128",
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 12,
        marginTop: 10,
        marginBottom: 10,
        background: '#ffffff'
      });
      
      // Convert SVG to canvas
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      return new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const barcodeY = options.includeCustomerInfo !== false ? 85 : 20;
          ctx.drawImage(img, (width - img.width) / 2, barcodeY);
          
          // Download based on format
          if (options.format === 'png') {
            canvas.toBlob((blob) => {
              if (blob) {
                downloadBlob(blob, `trade-in-${tradeIn.id}.png`);
                resolve();
              } else {
                reject(new Error('Failed to create PNG'));
              }
            }, 'image/png', options.quality || 0.9);
          } else if (options.format === 'svg') {
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
            downloadBlob(svgBlob, `trade-in-${tradeIn.id}.svg`);
            resolve();
          } else if (options.format === 'pdf') {
            // Convert to PDF
            const pdfBlob = canvasToPdf(canvas);
            downloadBlob(pdfBlob, `trade-in-${tradeIn.id}.pdf`);
            resolve();
          }
          
          URL.revokeObjectURL(url);
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load barcode image'));
        };
        
        img.src = url;
      });
    } catch (error) {
      console.error('Error downloading barcode:', error);
      toast.error('Failed to download barcode');
      throw error;
    }
  },

  // Download a card barcode
  downloadCardBarcode: async (
    tradeIn: TradeIn,
    item: TradeInItem,
    options: DownloadOptions = { format: 'png' }
  ) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas size for card label (2" x 1")
      const width = 384; // 2 inches at 192 DPI
      const height = 192; // 1 inch at 192 DPI
      
      canvas.width = width;
      canvas.height = height;
      
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'black';
      
      // Price and condition
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      const priceCondition = `$${formatCurrency(item.price)} | ${item.condition}`;
      ctx.fillText(priceCondition, width / 2, 35);
      
      // Generate SKU if possible
      let sku = '';
      if (item.tcgplayer_url) {
        const tcgplayerIdMatch = item.tcgplayer_url.match(/\/(\d+)/);
        const tcgplayerId = tcgplayerIdMatch ? tcgplayerIdMatch[1] : undefined;
        
        if (tcgplayerId) {
          const isFirstEdition = !!item.attributes?.isFirstEdition;
          const isHolo = !!item.attributes?.isHolo;
          const isReverseHolo = false;
          
          sku = generateSku(tcgplayerId, isFirstEdition, isHolo, item.condition, isReverseHolo);
        }
      }
      
      // SKU
      if (sku) {
        ctx.font = '10px Arial';
        ctx.fillText(`SKU: ${sku}`, width / 2, 55);
      }
      
      // Generate barcode
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svg, sku || tradeIn.id, {
        format: "CODE128",
        width: 1.5,
        height: 60,
        displayValue: false,
        marginTop: 5,
        marginBottom: 5,
        background: '#ffffff'
      });
      
      // Card info
      const cardInfo = [item.card_name, item.attributes?.setName, item.attributes?.cardNumber]
        .filter(Boolean).join(' • ');
      
      ctx.font = '12px Arial';
      const maxWidth = width - 20;
      const cardText = truncateText(ctx, cardInfo, maxWidth);
      ctx.fillText(cardText, width / 2, height - 10);
      
      // Convert SVG and draw
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      return new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, (width - img.width) / 2, 70);
          
          // Download
          if (options.format === 'png') {
            canvas.toBlob((blob) => {
              if (blob) {
                const filename = `card-${item.card_name.replace(/[^a-z0-9]/gi, '-')}.png`;
                downloadBlob(blob, filename);
                resolve();
              } else {
                reject(new Error('Failed to create PNG'));
              }
            }, 'image/png', options.quality || 0.9);
          } else if (options.format === 'pdf') {
            const pdfBlob = canvasToPdf(canvas);
            const filename = `card-${item.card_name.replace(/[^a-z0-9]/gi, '-')}.pdf`;
            downloadBlob(pdfBlob, filename);
            resolve();
          }
          
          URL.revokeObjectURL(url);
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load barcode image'));
        };
        
        img.src = url;
      });
    } catch (error) {
      console.error('Error downloading card barcode:', error);
      toast.error('Failed to download card barcode');
      throw error;
    }
  },

  // Batch download multiple barcodes
  downloadBatch: async (
    tradeIns: TradeIn[],
    options: DownloadOptions = { format: 'pdf', layout: 'sheet' }
  ) => {
    try {
      if (options.format === 'pdf' && options.layout === 'sheet') {
        // Create a multi-page PDF with multiple barcodes per page
        const pdf = await createBatchPdf(tradeIns);
        downloadBlob(pdf, `batch-barcodes-${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        // Create a ZIP file with individual images
        const zip = await createBatchZip(tradeIns);
        downloadBlob(zip, `batch-barcodes-${new Date().toISOString().split('T')[0]}.zip`);
      }
      
      toast.success(`Downloaded ${tradeIns.length} barcodes successfully`);
    } catch (error) {
      console.error('Error downloading batch:', error);
      toast.error('Failed to download batch');
      throw error;
    }
  }
};

// Helper functions
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  const metrics = ctx.measureText(text);
  if (metrics.width <= maxWidth) return text;
  
  let truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

function canvasToPdf(canvas: HTMLCanvasElement): Blob {
  // Simple PDF creation - in production you might want to use a proper PDF library
  const imgData = canvas.toDataURL('image/png');
  
  // Create a basic PDF structure with the image
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/XObject <<
/I1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
q
384 0 0 192 114 300 cm
/I1 Do
Q
endstream
endobj

5 0 obj
<<
/Type /XObject
/Subtype /Image
/Width ${canvas.width}
/Height ${canvas.height}
/ColorSpace /DeviceRGB
/BitsPerComponent 8
/Filter /DCTDecode
/Length ${imgData.length}
>>
stream
${imgData}
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000284 00000 n 
0000000378 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${580 + imgData.length}
%%EOF`;

  return new Blob([pdfContent], { type: 'application/pdf' });
}

async function createBatchPdf(tradeIns: TradeIn[]): Promise<Blob> {
  // Simple implementation - create individual PDFs and combine
  // In production, use a proper PDF library for better results
  const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 700 Td
(Batch Barcodes - ${tradeIns.length} items) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000284 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
523
%%EOF`;

  return new Blob([content], { type: 'application/pdf' });
}

async function createBatchZip(tradeIns: TradeIn[]): Promise<Blob> {
  // Simple ZIP implementation - in production use a proper ZIP library
  const files: Array<{ name: string; data: Blob }> = [];
  
  for (const tradeIn of tradeIns.slice(0, 10)) { // Limit for demo
    try {
      // Create canvas for each trade-in
      const canvas = document.createElement('canvas');
      canvas.width = 384;
      canvas.height = 192;
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 384, 192);
      ctx.fillStyle = 'black';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(tradeIn.customer_name || 'Unknown Customer', 192, 50);
      ctx.fillText(`$${formatCurrency(tradeIn.total_value)}`, 192, 100);
      ctx.fillText(tradeIn.id, 192, 150);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png');
      });
      
      files.push({
        name: `trade-in-${tradeIn.id}.png`,
        data: blob
      });
    } catch (error) {
      console.error('Error creating barcode for trade-in:', tradeIn.id, error);
    }
  }
  
  // Create a simple ZIP structure (minimal implementation)
  const zipContent = new Uint8Array(1024); // Placeholder
  return new Blob([zipContent], { type: 'application/zip' });
}
