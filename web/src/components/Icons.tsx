import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const DepositIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Icon>
);

export const WithdrawIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 15V4M7 9l5-5 5 5M5 20h14" />
  </Icon>
);

export const SendIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const InIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M17 7L7 17M7 9v8h8" />
  </Icon>
);

export const OutIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 17L17 7M9 7h8v8" />
  </Icon>
);
