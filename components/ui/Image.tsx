import { forwardRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { motion } from 'framer-motion';

const ImageComponent = forwardRef<HTMLImageElement, ImageProps>(({ alt = '', ...props }, ref) => (
  <Image ref={ref as any} alt={alt} {...props} />
));

ImageComponent.displayName = 'ImageComponent';

export const MotionImage = motion.create(ImageComponent);
