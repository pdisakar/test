import React from 'react';

interface PackageProps {
    content: any;
}

export const Package: React.FC<PackageProps> = ({ content }) => {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-4">{content.title}</h1>
            <div className="flex gap-4 mb-6">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {content.duration} {content.durationUnit}
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    Price: ${content.defaultPrice}
                </span>
            </div>
            {content.bannerImage && (
                <img
                    src={content.bannerImage}
                    alt={content.bannerImageAlt}
                    className="w-full h-64 object-cover rounded-lg mb-8"
                />
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-semibold mb-4">Overview</h2>
                    <div
                        className="prose max-w-none mb-8"
                        dangerouslySetInnerHTML={{ __html: content.details }}
                    />

                    {content.itinerary && content.itinerary.length > 0 && (
                        <>
                            <h2 className="text-2xl font-semibold mb-4">Itinerary</h2>
                            <div className="space-y-4">
                                {content.itinerary.map((day: any) => (
                                    <div key={day.id} className="border p-4 rounded-lg">
                                        <h3 className="font-bold">Day {day.dayNumber}: {day.title}</h3>
                                        <p className="text-gray-600">{day.description}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <div>
                    <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
                        <h3 className="text-xl font-bold mb-4">Book This Trip</h3>
                        <button className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors">
                            Book Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
