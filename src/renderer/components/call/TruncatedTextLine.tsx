import { useEffect, useRef, useState, type JSX } from "react";

import { Tooltip } from "../ui/tooltip/index.js";

export type TruncatedTextLineProps = Readonly<{
  text: string;
  className: string;
}>;

/**
 * - Purpose: single-line text with ellipsis and hover tooltip only when truncated.
 * - Inputs: display text and truncation line className.
 * - Outputs: span with conditional Tooltip wrapper.
 */
export function TruncatedTextLine({ text, className }: TruncatedTextLineProps): JSX.Element {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const node = textRef.current;
    if (node === null) {
      return;
    }

    const updateTruncation = (): void => {
      setIsTruncated(node.scrollWidth > node.clientWidth);
    };

    updateTruncation();

    const observer = new ResizeObserver(updateTruncation);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [text]);

  return (
    <Tooltip label={text} delayDuration={0} disabled={!isTruncated}>
      <span ref={textRef} className={className}>
        {text}
      </span>
    </Tooltip>
  );
}
