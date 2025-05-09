
import React from 'react';

interface CardImageProps {
  imageUrl?: string | null;
  name: string;
}

const CardImage: React.FC<CardImageProps> = ({ imageUrl, name }) => {
  return (
    <div className="w-16 h-16 overflow-hidden rounded-md flex-shrink-0 bg-gray-100">
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Replace broken image with placeholder
            e.currentTarget.src = 'https://via.placeholder.com/64?text=?';
          }} 
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <span className="text-2xl">?</span>
        </div>
      )}
    </div>
  );
};

export default CardImage;
