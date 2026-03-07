"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import Image from "next/image";

const VIDEOS = [
  {
    id: "oU1WSUY6_7E",
    title: "Cor Jesu College Corporate Video",
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
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
      setActiveVideoId(null);
    };
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

        <div className="relative fade-in-up fade-in-up-delay-1">
          {/* Carousel viewport — disable pointer events when video is playing */}
          <div
            className={`overflow-hidden rounded-2xl ${activeVideoId ? "pointer-events-none" : ""}`}
            ref={emblaRef}
          >
            <div className="flex">
              {VIDEOS.map((video) => (
                <div key={video.id} className="flex-[0_0_100%] min-w-0">
                  <div
                    className="relative w-full overflow-hidden rounded-2xl shadow-lg border border-border aspect-[4/3] sm:aspect-video"
                  >
                    <button
                      type="button"
                      className="absolute inset-0 w-full h-full cursor-pointer group"
                      onClick={() => setActiveVideoId(video.id)}
                      aria-label={`Play ${video.title}`}
                    >
                      <Image
                        src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                        alt={video.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 896px"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-cjc-red text-white shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-7 w-7 sm:h-8 sm:w-8 ml-1" fill="currentColor" />
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Video player overlay — completely above Embla, receives all touch events */}
          {activeVideoId && (
            <div className="absolute inset-0 z-30">
              <iframe
                className="absolute inset-0 w-full h-full rounded-2xl"
                src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={VIDEOS.find((v) => v.id === activeVideoId)?.title || "Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
              {/* Close button — positioned outside the video, above top-right */}
              <button
                onClick={() => setActiveVideoId(null)}
                className="absolute -top-12 right-0 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shadow-lg hover:opacity-80 transition-opacity"
                aria-label="Close video"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Prev / Next arrows — hidden when video is playing */}
          {!activeVideoId && (
            <>
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
            </>
          )}
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
