"use client";
import { cn } from "@/lib/utils";
import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
} from "react";

const MouseEnterContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>] | undefined
>(undefined);

export const CardContainer = ({
  children,
  className,
  containerClassName,
  disabled = false,
  resetOnDisable = false,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  resetOnDisable?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);
  const animationRef = useRef<number>();

  // Reset to neutral position when disabled
  useEffect(() => {
    if (disabled && resetOnDisable && containerRef.current) {
      setIsMouseEntered(false);
      containerRef.current.style.transition = 'transform 0.3s ease-out';
      containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
      
      // Remove transition after animation completes
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transition = '';
        }
      }, 300);
    }
  }, [disabled, resetOnDisable]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || disabled) return;
    
    // Cancel previous animation frame to prevent jitter
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      
      const { left, top, width, height } =
        containerRef.current.getBoundingClientRect();
      
      // Calculate relative position (0 to 1)
      const relativeX = (e.clientX - left) / width;
      const relativeY = (e.clientY - top) / height;
      
      // Clamp values between 0 and 1 to prevent edge jitter
      const clampedX = Math.max(0, Math.min(1, relativeX));
      const clampedY = Math.max(0, Math.min(1, relativeY));
      
      // Convert to rotation values with reduced intensity and smooth boundaries
      const rotateX = (clampedY - 0.5) * 15; // Reduced from 25 to 15
      const rotateY = (clampedX - 0.5) * -15; // Reduced from 25 to 15
      
      containerRef.current.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    });
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsMouseEntered(true);
    if (!containerRef.current) return;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || disabled) return;
    setIsMouseEntered(false);
    // Smooth transition back to neutral position
    containerRef.current.style.transition = 'transform 0.3s ease-out';
    containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
    
    // Remove transition after animation completes to allow smooth mouse movements
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.style.transition = '';
      }
    }, 300);
  };

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div
        className={cn(
          "w-full h-full flex items-center justify-center",
          containerClassName
        )}
        style={{
          perspective: "1000px",
        }}
      >
        <div
          ref={containerRef}
          onMouseEnter={disabled ? undefined : handleMouseEnter}
          onMouseMove={disabled ? undefined : handleMouseMove}
          onMouseLeave={disabled ? undefined : handleMouseLeave}
          className={cn(
            "flex items-center justify-center relative transition-all duration-200 ease-linear",
            // Add padding to create a buffer zone for smoother mouse tracking
            "p-4",
            className
          )}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
};

export const CardBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "h-96 w-96 [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardItem = ({
  as: Tag = "div",
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}: {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  rotateZ?: number | string;
  [key: string]: any;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isMouseEntered] = useMouseEnter();

  useEffect(() => {
    handleAnimations();
  }, [isMouseEntered]);

  const handleAnimations = () => {
    if (!ref.current) return;
    if (isMouseEntered) {
      ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
    } else {
      ref.current.style.transform = `translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
    }
  };

  return (
    <Tag
      ref={ref}
      className={cn("w-fit transition duration-200 ease-linear", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
};

// Create a hook to use the context
export const useMouseEnter = () => {
  const context = useContext(MouseEnterContext);
  if (context === undefined) {
    throw new Error("useMouseEnter must be used within a MouseEnterProvider");
  }
  return context;
};
