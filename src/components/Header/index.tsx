import React, { useEffect, useState } from "react";
import axios from "axios";
import clsx from "clsx";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import Router, { useRouter } from "next/router";
import Link from "next/link";
import LoginDialog from "../LoginDialog";
import GoPremiumDialog from "../GoPremiumDialog";

type Props = {
  className?: string;
  type?: string;
};

const Header = (props: Props) => {
  const router = useRouter();
  const session = useSession();
  const [user, setUser] = useState<{ [x: string]: any }>();
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  useEffect(() => {
    const fetchUsers = () => {
      supabaseClient
        .from("users")
        .select()
        .then(({ data, error }) => {
          setUser(data?.[0]);
        });
    };
    fetchUsers();
  }, []);

  const onLogout = async () => {
    try {
      const data = await supabaseClient.auth.signOut();
      router.push("/");
      setUser({});
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <h1
          className="text-xl font-bold cursor-pointer"
          onClick={() => router.push("/")}
        >
          My Chatbot
        </h1>
      </div>
      <div className="">
        {user?.upgraded ? (
          <form
            className="inline-block w-16 mr-6"
            action="/api/stripe"
            method="POST"
          >
            <input
              className="invisible w-0 h-0"
              name="redirectUrl"
              id="redirectUrl"
              defaultValue={router.pathname}
            />
            <input
              className="invisible w-0 h-0"
              name="customer"
              id="customer"
              defaultValue={user.stripe_customer_id}
            />
            <button type="submit" role="link" className="">
              Account
            </button>
          </form>
        ) : (
          <GoPremiumDialog className="mr-6" />
        )}
        <Link className={clsx(!session && "hidden", "mr-6")} href="/chat">
          Chat
        </Link>
        <Link className={clsx(!session && "hidden", "mr-6")} href="/documents">
          Documents
        </Link>
        {session ? (
          <>
            {/* <div className='inline-block mr-2'>Hello, {session.user.user_metadata.name}</div> */}
            <a className="cursor-pointer" onClick={onLogout}>
              Logout
            </a>
          </>
        ) : (
          <LoginDialog />
        )}
      </div>
    </div>
  );
};

export default Header;
