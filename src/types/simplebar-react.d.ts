declare module 'simplebar-react' {
  import { ComponentType, HTMLAttributes } from 'react';

  export interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    scrollableNodeProps?: HTMLAttributes<HTMLDivElement>;
    autoHide?: boolean;
    forceVisible?: boolean | 'x' | 'y';
    clickOnTrack?: boolean;
    scrollbarMinSize?: number;
    scrollbarMaxSize?: number;
    direction?: 'rtl' | 'ltr';
    timeout?: number;
    classNames?: {
      content?: string;
      scrollContent?: string;
      scrollbar?: string;
      track?: string;
    };
  }

  const SimpleBar: ComponentType<Props>;
  export default SimpleBar;
}
