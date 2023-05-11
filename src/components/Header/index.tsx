import React, { useEffect } from 'react';
import { useSession } from "@supabase/auth-helpers-react";
import axios from 'axios';
import Router, { useRouter } from 'next/router';
import Link from 'next/link';


type Props = {
  className?: string
}

const Header = (props: Props) => {
  const router = useRouter();
  const session = useSession();

  const onLogout = async () => {
    try {
      const data = await axios.post('/api/server-client/logout');
      Router.reload();
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className='flex items-center justify-between p-4 bg-[#A1B5D8]'>
      <div>
        <h1 className='text-xl font-bold'>Note AI</h1>
      </div>
      <div className="">
        <Link
          className='mr-6'
          href="/"
        >
          Chat
        </Link>
        <Link
          className='mr-6'
          href='/documents'
        >
          Documents
        </Link>
        {
          session ?
            <>
              {/* <div className='inline-block mr-2'>Hello, {session.user.user_metadata.name}</div> */}
              <a
                className='cursor-pointer'
                onClick={onLogout}>
                Logout
              </a>
            </>

            :
            <a
              className='cursor-pointer'
              onClick={() => router.push("/login")}>
              Login
            </a>
        }
      </div>
    </div>

  )
}

export default Header