import "@/styles/globals.css";
import { useEffect, useState } from "react";
import type { AppProps } from "next/app";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import axios from "axios";
import { useRouter } from "next/router";

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useEffect(() => {
    axios.get('/api/server-client')
      .then(({ data }) => {
        if (!data?.user) router.replace('/login');
      })
  }, [])



  return <Component {...pageProps} />;
}

export default function AppWrapper(props: AppProps) {
  return <App {...props} />

  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={props.pageProps.initialSession}
    >
      <App {...props} />
    </SessionContextProvider>
  );
}
