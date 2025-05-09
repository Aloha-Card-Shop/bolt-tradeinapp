
import React from 'react';
import { ImageOff } from 'lucide-react';

interface CardImageProps {
  imageUrl?: string | null;
  name: string;
}

const CardImage: React.FC<CardImageProps> = ({ imageUrl, name }) => {
  return (
    <div className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://placehold.co/64x80?text=No+Image';
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageOff className="h-5 w-5 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default CardImage;
