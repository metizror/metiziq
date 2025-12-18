import { cn } from "./utils";

function Skeleton({ className, ...props }: any) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md",
        "bg-[#f3f4f6]",
        "dark:bg-gray-800",
        className
      )}
      style={{
        background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
      {...props}
    />
  );
}

export { Skeleton };
