"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface Props {
  onSuccess: (credential: string) => void;
}

export default function GoogleSignInButton({ onSuccess }: Props) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const initializeGoogle = () => {
    if (!window.google || !buttonRef.current || initializedRef.current) return;
    initializedRef.current = true;

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: (response: { credential: string }) => {
        onSuccess(response.credential);
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width: "100%",
    });
  };

  useEffect(() => {
    if (window.google) initializeGoogle();
  });

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogle}
      />
      <div ref={buttonRef} className="flex justify-center" />
    </>
  );
}
