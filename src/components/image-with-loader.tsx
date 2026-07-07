
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

interface ImageWithLoaderProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageWithLoader({ src, alt, className }: ImageWithLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={cn("relative w-full h-full", className)}>
      {isLoading && <Skeleton className="absolute inset-0" />}
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
            "object-cover transition-opacity duration-500",
            isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setIsLoading(false)}
        unoptimized // Necessary for external data URLs from Earth Engine
      />
    </div>
  );
}
