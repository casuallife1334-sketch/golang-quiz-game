import { useEffect, useState } from "react";
import { resolveImageUrl } from "../utils/imageUtils.js";
import "../styles/image-status.css";

export default function ImageWithStatus({ src, alt, className = "", style, ...props }) {
  const resolvedSrc = resolveImageUrl(src);
  const [failedSrc, setFailedSrc] = useState("");

  useEffect(() => {
    setFailedSrc("");
  }, [resolvedSrc]);

  if (!resolvedSrc) return null;

  if (failedSrc === resolvedSrc) {
    return (
      <div className={`image-load-error ${className}`} style={style} role="status">
        Не удалось загрузить изображение
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailedSrc(resolvedSrc)}
      {...props}
    />
  );
}
