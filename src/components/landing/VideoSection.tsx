"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const VIDEOS = [
  {
    id: "oU1WSUY6_7E",
    title: "Cor Jesu College",
  },
  {
    id: "ha3-vd3zSzI",
    title: "Cor Jesu College",
  },
  {
    id: "QiVoYIrXFMY",
    title: "Cor Jesu College",
  },
];

export function VideoSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopAllVideos = useCallback(() => {
    if (!containerRef.current) return;
    const iframes = containerRef.current.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      const src = iframe.src;
      iframe.src = "";
      iframe.src = src;
    });
  }, []);

  const scrollPrev = useCallback(() => {
    stopAllVideos();
    emblaApi?.scrollPrev();
  }, [emblaApi, stopAllVideos]);

  const scrollNext = useCallback(() => {
    stopAllVideos();
    emblaApi?.scrollNext();
  }, [emblaApi, stopAllVideos]);

  const scrollTo = useCallback(
    (index: number) => {
      stopAllVideos();
      emblaApi?.scrollTo(index);
    },
    [emblaApi, stopAllVideos]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="bg-muted/30 py-24 lg:py-32">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16 fade-in-up">
          <p className="text-sm font-semibold text-cjc-red uppercase tracking-wider mb-3">
            Campus Life
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Experience Cor Jesu College
          </h2>
        </div>

        <div className="relative fade-in-up fade-in-up-delay-1" ref={containerRef}>
          {/* Carousel viewport */}
          <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
            <div className="flex">
              {VIDEOS.map((video) => (
                <div key={video.id} className="flex-[0_0_100%] min-w-0">
                  <div
                    className="relative w-full overflow-hidden rounded-2xl shadow-lg border border-border"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${video.id}?enablejsapi=1`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prev / Next arrows */}
          <button
            onClick={scrollPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 shadow-md border border-border backdrop-blur-sm transition-colors hover:bg-background"
            aria-label="Previous video"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 shadow-md border border-border backdrop-blur-sm transition-colors hover:bg-background"
            aria-label="Next video"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {VIDEOS.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === selectedIndex
                  ? "w-8 bg-cjc-red"
                  : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
