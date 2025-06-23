'use client'
import type { ChildrenType } from '@/types/component-props'
import SimpleBar from 'simplebar-react'

interface SimplebarReactClientProps extends ChildrenType {
  className?: string;
  style?: React.CSSProperties;
  autoHide?: boolean;
  forceVisible?: boolean | 'x' | 'y';
  clickOnTrack?: boolean;
  scrollbarMinSize?: number;
  scrollbarMaxSize?: number;
  direction?: 'rtl' | 'ltr';
  timeout?: number;
  [key: string]: any;
}

const SimplebarReactClient = ({ children, ...options }: SimplebarReactClientProps) => {
  return <SimpleBar {...options}>{children}</SimpleBar>
}

export default SimplebarReactClient
