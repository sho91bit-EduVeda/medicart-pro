import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.jpg";
import kalyaanamBanner from "@/assets/banner.jpg";

interface BannerSlide {
  image: string;
  title: string;
  subtitle: string;
  gradientOverlay?: string;
}

const slides: BannerSlide[] = [
  {
    image: kalyaanamBanner,
    title: "",
    subtitle: "",
    gradientOverlay: "",
  },
  {
    image: heroBanner,
    title: "Your Health, Our Priority",
    subtitle: "Quality medicines with detailed information at your fingertips",
    gradientOverlay: "bg-gradient-to-r from-primary/90 to-primary/60",
  },
];

export const HeroBanner = ({ discountPercentage }: { discountPercentage: number }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  return (
    <section className="relative h-[400px] overflow-hidden group">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
          style={{backgroundColor: '#f4a824'}} 
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full"
            style={{ objectFit: 'contain'}}
          />
          <div className={`absolute inset-0 ${slide.gradientOverlay} flex items-center`}>
            <div className="container mx-auto px-4">
              <div className="max-w-2xl text-white">
                <h2 className="text-5xl font-bold mb-4">{slide.title}</h2>
                <p className="text-xl mb-6 text-white/90">{slide.subtitle}</p>
                {index === 1 && discountPercentage > 0 && (
                  <div className="inline-block bg-secondary text-secondary-foreground px-6 py-3 rounded-full font-bold text-lg">
                    {discountPercentage}% OFF on all products!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={goToPrevious}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={goToNext}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75"
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
