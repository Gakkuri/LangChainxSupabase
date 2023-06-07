import "@/styles/globals.css";
import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import type { AppProps } from "next/app";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import {
  SessionContextProvider,
  useSession,
} from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
// import { ThemeProvider } from 'next-themes'
import ThemeSwitcher from "@/components/ThemeSwitcher";
import axios from "axios";
import Loader from "@/components/Loader";
import clsx from "clsx";

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const session = useSession();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  useEffect(() => {
    if (router.query.isCheckout) {
      console.log(router.query.isCheckout);
      setLoading(true);
      supabaseClient
        .from("users")
        .select()
        .then(({ data, error }) => {
          const isUpgraded = data?.[0]?.upgraded;
          if (!isUpgraded) {
            formRef?.current?.submit();
          } else {
            alert("You are already upgraded");
            setLoading(false);
          }
          router.push("/", undefined, { shallow: true });
        });
    }
  }, [router.query.isCheckout]);

  return (
    <div className="relative">
      {/* <ThemeSwitcher className="absolute bottom-5 left-5 " /> */}
      {/* TODO we need docs for this, wtf is this hidden stripe thing? */}
      <form
        className="invisible h-0 w-0"
        ref={(el) => {
          formRef.current = el;
        }}
        action="/api/stripe/checkout"
        method="POST"
      >
        <input
          className="invisible h-0 w-0"
          name="email"
          id="email"
          defaultValue={session?.user.email}
        />
      </form>
      {loading && (
        <div
          className={clsx(
            "absolute w-screen h-screen opacity-80 bg-slate-950",
            "flex items-center justify-center"
          )}
        >
          <Loader className="invert" w={80} h={80} />
        </div>
      )}
      <Component {...pageProps} />
    </div>
  );
}

export default function AppWrapper(props: AppProps) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    // TODO: wtf is this? why is it commented out?
    // <ThemeProvider forcedTheme="light">
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={props.pageProps.initialSession}
    >
      <Head>
        <title>My Chatbot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <App {...props} />
    </SessionContextProvider>
    // </ThemeProvider>
  );
}
