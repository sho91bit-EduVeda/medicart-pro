import React, { Suspense, lazy } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const Lottie = lazy(() => import('lottie-react'));

interface LottieAnimationProps {
    animationData: any;
    width?: string | number;
    height?: string | number;
    loop?: boolean;
    autoplay?: boolean;
    speed?: number;
    className?: string;
    fallbackImage?: string;
    altText?: string;
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({
    animationData,
    width = '100%',
    height = '100%',
    loop = true,
    autoplay = true,
    speed = 1,
    className,
    fallbackImage,
    altText = "Animation"
}) => {
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    // Safe check for valid animation data
    const isValidAnimation = animationData && typeof animationData === 'object';

    if (!isValidAnimation) {
        if (fallbackImage) {
            return (
                <img
                    src={fallbackImage}
                    alt={altText}
                    className={cn("object-contain", className)}
                    style={{ width, height }}
                />
            );
        }
        return null;
    }

    return (
        <div
            ref={ref}
            className={cn("flex items-center justify-center overflow-hidden", className)}
            style={{ width, height }}
            role="img"
            aria-label={altText}
        >
            {inView ? (
                <Suspense fallback={<div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
                    <div style={{ width: '100%', height: '100%' }}>
                        <DotLottieWrapper
                            animationData={animationData}
                            loop={loop}
                            autoplay={autoplay}
                        //   speed={speed} // lottie-react component prop handling varies, usually passed directly or via lottieRef
                        />
                    </div>
                </Suspense>
            ) : (
                <div className="w-full h-full bg-muted/10 animate-pulse rounded-md" />
            )}
        </div>
    );
};

// Wrapper to handle lottie-react specifics cleanly
const DotLottieWrapper = ({ animationData, loop, autoplay }: any) => {
    // We need to suppress the speed prop here as lottie-react handles it via ref or slightly differently in some versions
    // but standard autoplay/loop props work fine on the main component.
    return (
        <Lottie
            animationData={animationData}
            loop={loop}
            autoplay={autoplay}
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default LottieAnimation;
