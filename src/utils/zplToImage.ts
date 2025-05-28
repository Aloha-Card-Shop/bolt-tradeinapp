
interface ZplElement {
  type: 'text' | 'barcode';
  x: number;
  y: number;
  content: string;
  fontSize?: number;
  width?: number;
  height?: number;
}

export const parseZplToElements = (zpl: string): ZplElement[] => {
  const elements: ZplElement[] = [];
  const lines = zpl.split('\n');
  
  let currentX = 0;
  let currentY = 0;
  let currentFontSize = 30;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Parse ^FO commands (Field Origin - positioning)
    const foMatch = line.match(/\^FO(\d+),(\d+)/);
    if (foMatch) {
      currentX = parseInt(foMatch[1]);
      currentY = parseInt(foMatch[2]);
      continue;
    }
    
    // Parse ^A commands (Font selection)
    const fontMatch = line.match(/\^A0N,(\d+),(\d+)/);
    if (fontMatch) {
      currentFontSize = Math.max(8, Math.min(48, parseInt(fontMatch[1]) / 8));
      continue;
    }
    
    // Parse ^FD commands (Field Data - text content)
    const fdMatch = line.match(/\^FD(.+?)\^FS/);
    if (fdMatch) {
      elements.push({
        type: 'text',
        x: currentX,
        y: currentY,
        content: fdMatch[1],
        fontSize: currentFontSize
      });
      continue;
    }
    
    // Parse ^BC commands (Barcode)
    const bcMatch = line.match(/\^BCN,(\d+)/);
    if (bcMatch && line.includes('^FD') && line.includes('^FS')) {
      const barcodeHeight = parseInt(bcMatch[1]) || 100;
      const barcodeData = line.match(/\^FD(.+?)\^FS/)?.[1] || '';
      
      elements.push({
        type: 'barcode',
        x: currentX,
        y: currentY,
        content: barcodeData,
        width: 200,
        height: Math.min(120, barcodeHeight)
      });
    }
  }
  
  return elements;
};

export const renderZplToCanvas = (zpl: string, width: number = 384, height: number = 288): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  // Set white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  
  // Set default styles
  ctx.fillStyle = 'black';
  ctx.textBaseline = 'top';
  
  const elements = parseZplToElements(zpl);
  
  elements.forEach(element => {
    if (element.type === 'text') {
      ctx.font = `${element.fontSize || 12}px monospace`;
      ctx.fillText(element.content, element.x, element.y);
    } else if (element.type === 'barcode') {
      // Simple barcode representation with vertical lines
      const barWidth = 2;
      const spacing = 1;
      const totalBars = Math.floor((element.width || 200) / (barWidth + spacing));
      
      for (let i = 0; i < totalBars; i++) {
        if (i % 2 === 0) { // Alternating bars for visual effect
          ctx.fillRect(
            element.x + i * (barWidth + spacing),
            element.y,
            barWidth,
            element.height || 50
          );
        }
      }
      
      // Add barcode text below
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        element.content,
        element.x + (element.width || 200) / 2,
        element.y + (element.height || 50) + 5
      );
      ctx.textAlign = 'left';
    }
  });
  
  return canvas;
};

export const convertZplToImageBase64 = (zpl: string, width: number = 384, height: number = 288): string => {
  const canvas = renderZplToCanvas(zpl, width, height);
  return canvas.toDataURL('image/png').split(',')[1]; // Return just the base64 part
};
