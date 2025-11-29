import React from 'react';

interface PlacesProps {
    content: any;
}

export const Places: React.FC<PlacesProps> = ({ content }) => {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-4">{content.title}</h1>
            {content.bannerImage && (
                <img
                    src={content.bannerImage}
                    alt={content.bannerImageAlt}
                    className="w-full h-64 object-cover rounded-lg mb-8"
                />
            )}
            <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: content.description }}
            />
        </div>
    );
};
