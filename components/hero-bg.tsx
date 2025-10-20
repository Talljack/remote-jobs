export default function HeroBg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1920 1080"
      fill="none"
      className="pointer-events-none absolute top-0 left-0 -z-50 hidden [mask-image:linear-gradient(to_right,white,transparent,transparent,white)] opacity-20 lg:block"
    >
      <g clipPath="url(#clip0_4_5)">
        <rect width="1920" height="1080" />
        {Array.from({ length: 22 }).map((_, i) => (
          <line
            key={`h-${i}`}
            y1={49.5 + i * 50}
            x2="1920"
            y2={49.5 + i * 50}
            className="stroke-muted-foreground/30"
          />
        ))}
        <g clipPath="url(#clip1_4_5)">
          {Array.from({ length: 38 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={49.6133 + i * 50.114}
              y1="3.99995"
              x2={49.7268 + i * 50.114}
              y2="1084"
              className="stroke-muted-foreground/30"
            />
          ))}
        </g>
      </g>
      <defs>
        <clipPath id="clip0_4_5">
          <rect width="1920" height="1080" fill="#000000" />
        </clipPath>
        <clipPath id="clip1_4_5">
          <rect width="1920" height="1080" fill="#000000" transform="translate(-1 4)" />
        </clipPath>
      </defs>
    </svg>
  );
}
