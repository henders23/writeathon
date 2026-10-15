import type { Frame } from "@/lib/bank/types";

/** Where the paragraph would sit, and who it's for. */
export default function FrameLine({ frame }: { frame: Frame }) {
  return (
    <p className="frame-line">
      <span>{frame.genre}</span>
      <span aria-hidden="true">·</span>
      <span>
        <span className="sr-only">Reader: </span>for {frame.reader}
      </span>
    </p>
  );
}
