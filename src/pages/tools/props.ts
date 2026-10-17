import type { ServerChoice } from "../calendar/server";

/** Props every reference tool receives; tools that don't need the server ignore them. */
export interface ToolProps {
  choice: ServerChoice;
  onServerChange: (c: ServerChoice) => void;
  now: Date;
}
