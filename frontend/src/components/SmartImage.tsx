import React, { useState } from 'react';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: string;
};

export default function SmartImage({ src, alt, fallback = '/images/placeholder.svg', ...rest }: Props) {
  const [errored, setErrored] = useState(false);

  if (!src) {
    return <img src={fallback} alt={alt || 'placeholder'} {...rest} />;
  }

  return (
    // Use plain <img> to preserve existing styling and avoid Next.js image optimization complications in some setups
    <img
      src={errored ? fallback : String(src)}
      alt={alt}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
}
