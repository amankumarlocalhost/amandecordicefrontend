"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-lux flex flex-col items-center py-24 text-center" role="alert">
      <h1 className="font-display text-4xl">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-muted">We couldn&apos;t load this page. It may be a temporary problem with our store — please try again.</p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={() => reset()} className="btn btn-primary">Try again</button>
        <Link href="/" className="btn btn-outline">Go home</Link>
      </div>
    </div>
  );
}
