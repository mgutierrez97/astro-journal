"use client";

interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: "primary" | "secondary" | "ghost";
}

/**
 * CTA hierarchy:
 *   primary   — Gold tint bg + gold border + top highlight. Reflect CTA only.
 *   secondary — Neutral outline only. "View your reflection".
 *   ghost     — No border, tertiary text. "Back to feed".
 */
export default function CTAButton({
  variant,
  className = "",
  children,
  ...rest
}: CTAButtonProps) {
  const base =
    "inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium transition-opacity duration-200 hover:opacity-80 active:opacity-60 cursor-pointer";

  const variants = {
    primary: {
      style: {
        background: "rgba(200, 169, 110, 0.10)",
        border: "0.5px solid #C8A96E",
        borderTop: "0.5px solid rgba(232, 216, 168, 0.6)",
        borderRadius: "7px",
        color: "#E8D8A8",
      },
    },
    secondary: {
      style: {
        background: "transparent",
        border: "0.5px solid rgba(255,255,255,0.12)",
        borderRadius: "7px",
        color: "#8B909C",
      },
    },
    ghost: {
      style: {
        background: "transparent",
        border: "none",
        color: "#4A5060",
      },
    },
  };

  return (
    <button className={`${base} ${className}`} style={variants[variant].style} {...rest}>
      {children}
    </button>
  );
}
