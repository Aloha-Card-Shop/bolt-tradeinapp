import React, { useState, useEffect, useRef } from 'react';
import { renderZplToCanvas } from '../../utils/zplToImage';

interface EnhancedZplViewerProps {
  zplCode: string;
  printerType?: 'ZPL' | 'RAW';
  width?: number;
  height?: number;
}

const EnhancedZplViewer: React.FC<EnhancedZplViewerProps> = ({ 
  zplCode, 
  printerType = 'ZPL',
  width = 384, 
  height = 192 
}) => {
  const [viewMode, setViewMode] = useState<'zpl' | 'image'>('zpl');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageData, setImageData] = useState<string>('');

  useEffect(() => {
    if (viewMode === 'image' && zplCode) {
      try {
        // Generate image preview
        const canvas = renderZplToCanvas(zplCode, width, height);
        const imageDataUrl = canvas.toDataURL('image/png');
        setImageData(imageDataUrl);
        
        // Also update the canvas if ref is available
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = width;
            canvasRef.current.height = height;
            ctx.drawImage(canvas, 0, 0);
          }
        }
      } catch (error) {
        console.error('Error generating image preview:', error);
      }
    }
  }, [zplCode, viewMode, width, height]);

  // Default to image mode for RAW printers
  useEffect(() => {
    if (printerType === 'RAW') {
      setViewMode('image');
    }
  }, [printerType]);

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
    <div>
      {/* Mode Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => setViewMode('zpl')}
            className={`px-3 py-1 text-sm font-medium rounded-l-md border ${
              viewMode === 'zpl'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            ZPL Preview
          </button>
          <button
            onClick={() => setViewMode('image')}
            className={`px-3 py-1 text-sm font-medium rounded-r-md border-t border-r border-b ${
              viewMode === 'image'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Image Preview
          </button>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${
          printerType === 'ZPL' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-orange-100 text-orange-800'
        }`}>
          {printerType} Mode
        </span>
      </div>

      {/* Preview Container */}
      <div 
        className="border-2 border-gray-300 bg-white relative overflow-hidden mx-auto"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="absolute top-0 left-0 right-0 text-xs text-gray-500 bg-gray-100 px-2 py-1 border-b">
          {viewMode === 'zpl' ? 'ZPL' : 'Image'} Preview ({width}x{height}px)
        </div>
        
        {viewMode === 'zpl' ? (
          <div className="relative w-full h-full pt-6">
            {elements}
          </div>
        ) : (
          <div className="relative w-full h-full pt-6 flex items-center justify-center">
            {imageData ? (
              <img 
                src={imageData} 
                alt="Label Preview" 
                className="max-w-full max-h-full object-contain"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <canvas 
                ref={canvasRef} 
                className="max-w-full max-h-full border"
                style={{ width: width - 20, height: height - 30 }}
              />
            )}
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 text-center mt-2">
        {viewMode === 'zpl' 
          ? 'Simplified ZPL visualization. Actual output may vary based on printer settings.'
          : `${printerType} printers will receive this format. Image conversion from ZPL code.`
        }
      </div>
    </div>
  );
};

export default EnhancedZplViewer;
