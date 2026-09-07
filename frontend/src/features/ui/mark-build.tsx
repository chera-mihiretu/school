type MarkBuildProps = {
  size?: number;
  className?: string;
};

export function MarkBuild({ size = 88, className }: MarkBuildProps) {
  return (
    <span className={className}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width={size}
        height={size}
        overflow="visible"
        role="img"
        aria-label="School network mark"
        className="school-mark-build block"
      >
        <line
          x1="16"
          y1="12.4"
          x2="16"
          y2="7.6"
          stroke="currentColor"
          strokeWidth="2.2"
          className="r0"
        />
        <line
          x1="19.6"
          y1="16"
          x2="24.4"
          y2="16"
          stroke="currentColor"
          strokeWidth="2.2"
          className="r1"
        />
        <line
          x1="16"
          y1="19.6"
          x2="16"
          y2="24.4"
          stroke="currentColor"
          strokeWidth="2.2"
          className="r2"
        />
        <line
          x1="12.4"
          y1="16"
          x2="7.6"
          y2="16"
          stroke="currentColor"
          strokeWidth="2.2"
          className="r3"
        />
        <rect
          x="12.4"
          y="12.4"
          width="7.2"
          height="7.2"
          rx="1.6"
          fill="currentColor"
          className="hub"
        />
        <rect
          x="13.4"
          y="2.4"
          width="5.2"
          height="5.2"
          rx="1.2"
          fill="currentColor"
          className="n0"
        />
        <rect
          x="24.4"
          y="13.4"
          width="5.2"
          height="5.2"
          rx="1.2"
          fill="currentColor"
          className="n1"
        />
        <rect
          x="13.4"
          y="24.4"
          width="5.2"
          height="5.2"
          rx="1.2"
          fill="currentColor"
          className="n2"
        />
        <rect
          x="2.4"
          y="13.4"
          width="5.2"
          height="5.2"
          rx="1.2"
          fill="currentColor"
          className="n3"
        />
      </svg>
    </span>
  );
}
