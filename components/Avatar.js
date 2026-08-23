"use client";

export default function Avatar({ src, alt, size = "md" }) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-20 w-20 text-xl",
    xl: "h-32 w-32 text-4xl",
  };

  const fontSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-xl",
    xl: "text-4xl",
  };

  return (
    <div
      className={`flex flex-none items-center justify-center overflow-hidden rounded-full bg-base-800 ${sizeClasses[size] || sizeClasses.md}`}
    >
      {src ? (
        <img src={src} alt={alt || "Avatar"} className="h-full w-full object-cover" />
      ) : (
        <span className={`font-display font-bold text-white ${fontSize[size] || fontSize.md}`}>
          {(alt || "?")?.[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );
}
