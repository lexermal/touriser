import { Landing } from "@/components/landing/Landing";
import { bodyFont, displayFont, monoFont } from "./fonts";

export default function Home() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <Landing />
    </div>
  );
}
