import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

interface UseScanInputCaptureOptions {
  isActive: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  onScanReceived: (rawValue: string) => void;
}

export const useScanInputCapture = ({
  isActive,
  autoFocus = true,
  disabled = false,
  onScanReceived,
}: UseScanInputCaptureOptions) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const ignoreNextBlurRefocusRef = useRef(false);
  const [scanValue, setScanValue] = useState('');
  const isEnabled = isActive && !disabled;

  const focusInput = useCallback(() => {
    if (isEnabled) {
      inputRef.current?.focus();
    }
  }, [isEnabled]);

  useEffect(() => {
    if (!autoFocus || !isEnabled) {
      return;
    }

    const frameId = window.requestAnimationFrame(focusInput);
    return () => window.cancelAnimationFrame(frameId);
  }, [autoFocus, focusInput, isEnabled]);

  const commitScanValue = useCallback(
    (value: string) => {
      if (!isEnabled || value.length === 0) {
        return;
      }

      onScanReceived(value);
      setScanValue('');
    },
    [isEnabled, onScanReceived]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Enter') {
        return;
      }

      event.preventDefault();
      commitScanValue(event.currentTarget.value);
    },
    [commitScanValue]
  );

  const handleBlur = useCallback(() => {
    if (ignoreNextBlurRefocusRef.current) {
      ignoreNextBlurRefocusRef.current = false;
      return;
    }
    
    if (isEnabled) {
      window.requestAnimationFrame(focusInput);
    }
  }, [focusInput, isEnabled]);

  const resetScanValue = useCallback(() => {
    setScanValue('');
  }, []);

  return {
    inputRef,
    scanValue,
    setScanValue,
    resetScanValue,
    handleKeyDown,
    handleBlur,
    focusInput,
    ignoreNextBlur: () => {
      ignoreNextBlurRefocusRef.current = true;
    },
  };
};
