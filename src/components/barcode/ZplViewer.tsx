
import React from 'react';

interface ZplViewerProps {
  zplCode: string;
  width?: number;
  height?: number;
}

const ZplViewer: React.FC<ZplViewerProps> = ({ zplCode, width = 384, height = 192 }) => {
  // Parse basic ZPL commands to create a visual preview
  const parseZplToElements = (zpl: string) => {
    const elements: JSX.Element[] = [];
    const lines = zpl.split('\n');
    
    lines.forEach((line, index) => {
      // Parse ^FO commands (Field Origin - positioning)
      const foMatch = line.match(/\^FO(\d+),(\d+)/);
      // Parse ^FD commands (Field Data - text content)
      const fdMatch = line.match(/\^FD(.+?)\^FS/);
      // Parse ^BC commands (Barcode)
      const bcMatch = line.match(/\^BCN,(\d+)/);
      
      if (foMatch && fdMatch) {
        const x = parseInt(foMatch[1]);
        const y = parseInt(foMatch[2]);
        let fontSize = 12;
        
        // Look for font size in previous lines
        for (let i = Math.max(0, index - 2); i <= index; i++) {
          const prevFontMatch = lines[i]?.match(/\^A0N,(\d+),(\d+)/);
          if (prevFontMatch) {
            fontSize = Math.max(8, Math.min(32, parseInt(prevFontMatch[1]) / 4));
            break;
          }
        }
        
        const text = fdMatch[1].replace(/\^FS$/, '');
        
        elements.push(
          <div
            key={`text-${index}`}
            className="absolute text-black font-mono"
            style={{
              left: `${(x / 400) * 100}%`,
              top: `${(y / 300) * 100}%`,
              fontSize: `${fontSize}px`,
              lineHeight: '1.2'
            }}
          >
            {text}
          </div>
        );
      }
      
      // Handle barcode rendering
      if (foMatch && bcMatch && line.includes('^FD') && line.includes('^FS')) {
        const x = parseInt(foMatch[1]);
        const y = parseInt(foMatch[2]);
        const barcodeHeight = parseInt(bcMatch[1]) || 50;
        const barcodeData = line.match(/\^FD(.+?)\^FS/)?.[1] || '';
        
        elements.push(
          <div
            key={`barcode-${index}`}
            className="absolute bg-black flex flex-col items-center justify-end"
            style={{
              left: `${(x / 400) * 100}%`,
              top: `${(y / 300) * 100}%`,
              width: '120px',
              height: `${Math.min(60, barcodeHeight / 2)}px`,
              background: 'repeating-linear-gradient(90deg, black 0px, black 2px, white 2px, white 4px)',
            }}
          >
            <div className="text-xs mt-1 text-black bg-white px-1">
              {barcodeData}
            </div>
          </div>
        );
      }
    });
    
    return elements;
  };

  const elements = parseZplToElements(zplCode);

  return (
    <div 
      className="border-2 border-gray-300 bg-white relative overflow-hidden mx-auto"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className="absolute top-0 left-0 right-0 text-xs text-gray-500 bg-gray-100 px-2 py-1 border-b">
        ZPL Preview ({width}x{height}px)
      </div>
      <div className="relative w-full h-full pt-6">
        {elements}
      </div>
    </div>
  );
};

export default ZplViewer;
