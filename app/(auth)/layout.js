import Image from "next/image";
import Logo from "@/components/ui/Logo";
import { PHOTOS, unsplash } from "@/lib/images";

export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image src={unsplash(PHOTOS.auth.src, 1600)} alt={PHOTOS.auth.alt} fill sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-olive-950/70 via-transparent to-olive-950/45" />
        <div className="absolute top-10 left-12">
          <Logo inverted />
        </div>
        <p className="font-display absolute bottom-12 left-12 max-w-sm text-4xl leading-tight text-cream-50">Every table tells a story.</p>
      </div>
      <div className="flex items-start justify-center px-4 py-12 sm:px-6 lg:items-center lg:py-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
