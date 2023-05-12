import React, { useEffect, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import { useSession } from "@supabase/auth-helpers-react";
import Router, { useRouter } from 'next/router';
import Link from 'next/link';
import LoginDialog from '../LoginDialog';

type Props = {
  className?: string
  type?: string
}

const Header = (props: Props) => {
  const router = useRouter();
  const remoteSession = useSession();

  const [session, setSession] = useState(remoteSession);

  useEffect(() => {
    if (remoteSession) setSession(remoteSession);
  }, [remoteSession])


  const onLogout = async () => {
    try {
      const data = await axios.post('/api/server-client/logout');
      router.push('/');
      setSession(null);
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className='flex items-center justify-between p-4 bg-[#A1B5D8]'>
      <div>
        <h1
          className='text-xl font-bold cursor-pointer'
          onClick={() => router.push('/')}
        >
          Note AI
        </h1>
      </div>
      <div>
        <Link
          className={clsx(!session && "hidden", 'mr-6')}
          href="/chat"
        >
          Chat
        </Link>
        <Link
          className={clsx(!session && "hidden", 'mr-6')}
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
            <LoginDialog />
        }
      </div>
    </div>

  )
}

export default Header