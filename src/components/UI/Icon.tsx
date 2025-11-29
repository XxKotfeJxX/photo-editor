interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 20, className = "" }: IconProps) {
  return (
    <span
      className={`inline-block bg-gray-700 text-white flex items-center justify-center rounded ${className}`}
      style={{ width: size, height: size }}
    >
      {name}
    </span>
  );
}
