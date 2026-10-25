import Link from "next/link";
import { CrestMark } from "@/components/ui/Logo";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="container-lux flex flex-col items-center py-24 text-center sm:py-32">
      <CrestMark size={72} className="mb-6 opacity-90" />
      <p className="font-script text-6xl text-gold">Oops</p>
      <h1 className="font-display mt-2 text-4xl sm:text-5xl">This page isn&apos;t on the table</h1>
      <p className="mt-4 max-w-md text-sm text-muted">The piece or page you&apos;re looking for may have moved or is no longer available.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn btn-primary">Browse the collection</Link>
        <Link href="/" className="btn btn-outline">Back to home</Link>
      </div>
    </div>
  );
}
