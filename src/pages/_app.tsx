import "@/styles/globals.css";
import { useEffect, useState } from "react";
import type { AppProps } from "next/app";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
// import { ThemeProvider } from 'next-themes'
import ThemeSwitcher from "@/components/ThemeSwitcher";

function App({ Component, pageProps }: AppProps) {
  return <div className="relative">
    {/* <ThemeSwitcher className="absolute bottom-5 left-5 " /> */}
    <Component {...pageProps} />
  </div>
}

export default function AppWrapper(props: AppProps) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    // <ThemeProvider forcedTheme="light">
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={props.pageProps.initialSession}
    >
      <App {...props} />
    </SessionContextProvider>
    // </ThemeProvider>
  );
}
