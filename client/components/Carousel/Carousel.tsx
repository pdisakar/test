'use client';

import React, { useCallback, useEffect, useState, createContext, useContext } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type CarouselContextProps = {
    emblaRef: React.Ref<HTMLDivElement>;
    emblaApi: EmblaCarouselType | undefined;
    selectedIndex: number;
    scrollSnaps: number[];
    prevBtnDisabled: boolean;
    nextBtnDisabled: boolean;
    scrollPrev: () => void;
    scrollNext: () => void;
    scrollTo: (index: number) => void;
};

const CarouselContext = createContext<CarouselContextProps | undefined>(undefined);

const useCarousel = () => {
    const context = useContext(CarouselContext);
    if (!context) {
        throw new Error('useCarousel must be used within a Carousel');
    }
    return context;
};

type CarouselProps = {
    children: React.ReactNode;
    options?: EmblaOptionsType;
    className?: string;
    autoplay?: boolean;
};

const Carousel = ({ children, options, className, autoplay = false }: CarouselProps) => {
    const [emblaRef, emblaApi] = useEmblaCarousel(options, autoplay ? [Autoplay({ delay: 4000 })] : []);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
    const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
    const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
    const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

    const onInit = useCallback((emblaApi: EmblaCarouselType) => {
        setScrollSnaps(emblaApi.scrollSnapList());
    }, []);

    const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
        setPrevBtnDisabled(!emblaApi.canScrollPrev());
        setNextBtnDisabled(!emblaApi.canScrollNext());
    }, []);

    useEffect(() => {
        if (!emblaApi) return;

        onInit(emblaApi);
        onSelect(emblaApi);
        emblaApi.on('reInit', onInit);
        emblaApi.on('reInit', onSelect);
        emblaApi.on('select', onSelect);
    }, [emblaApi, onInit, onSelect]);

    return (
        <CarouselContext.Provider
            value={{
                emblaRef,
                emblaApi,
                selectedIndex,
                scrollSnaps,
                prevBtnDisabled,
                nextBtnDisabled,
                scrollPrev,
                scrollNext,
                scrollTo,
            }}
        >
            <div className={cn("relative", className)}>
                {children}
            </div>
        </CarouselContext.Provider>
    );
};

const CarouselContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    const { emblaRef } = useCarousel();
    return (
        <div className="overflow-hidden" ref={emblaRef}>
            <div className={cn("", className)}>
                {children}
            </div>
        </div>
    );
};

const CarouselItem = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return (
        <div className={cn("", className)}>
            {children}
        </div>
    );
};

const CarouselPrevious = ({ className, children }: { className?: string, children?: React.ReactNode }) => {
    const { scrollPrev, prevBtnDisabled } = useCarousel();
    return (
        <button
            className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10",
                className
            )}
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
        >
            {children || <ChevronLeft className="w-6 h-6" />}
        </button>
    );
};

const CarouselNext = ({ className, children }: { className?: string, children?: React.ReactNode }) => {
    const { scrollNext, nextBtnDisabled } = useCarousel();
    return (
        <button
            className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10",
                className
            )}
            onClick={scrollNext}
            disabled={nextBtnDisabled}
        >
            {children || <ChevronRight className="w-6 h-6" />}
        </button>
    );
};

const CarouselDots = ({ className }: { className?: string }) => {
    const { scrollSnaps, selectedIndex, scrollTo } = useCarousel();
    return (
        <div className={cn("flex justify-center gap-2", className)}>
            {scrollSnaps.map((_, index) => (
                <button
                    key={index}
                    className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        index === selectedIndex ? "bg-primary w-8" : "bg-primary/20 hover:bg-primary/80 hover:cursor-pointer"
                    )}
                    onClick={() => scrollTo(index)}
                />
            ))}
        </div>
    );
};

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselDots, useCarousel };
