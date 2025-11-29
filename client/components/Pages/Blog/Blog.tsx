import React from 'react';

interface BlogProps {
    content: any;
}

export const Blog: React.FC<BlogProps> = ({ content }) => {
    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">{content.title}</h1>
            <div className="text-gray-500 mb-8">
                Published on {new Date(content.publishedDate).toLocaleDateString()}
            </div>
            {content.featuredImage && (
                <img
                    src={content.featuredImage}
                    alt={content.featuredImageAlt}
                    className="w-full h-96 object-cover rounded-lg mb-8"
                />
            )}
            <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: content.description }}
            />
        </div>
    );
};
