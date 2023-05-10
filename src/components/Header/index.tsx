import React, { useEffect } from 'react'
import { useSession } from "@supabase/auth-helpers-react";
import axios from 'axios'
import Router, { useRouter } from 'next/router'

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
    <div className='flex items-center justify-between m-4'>
      <div className=''>
        <button
          type="button"
          className={`inline-block rounded bg-slate-600 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white`}
          onClick={() => router.replace("/")}>
          Home
        </button>
        <button
          className="inline-block rounded bg-slate-600 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white ml-4"
          onClick={() => router.push('/documents')}>
          Documents List
        </button>
      </div>
      <div>
        {
          session ?
            <>
              <div className='inline-block mr-2'>Hello, {session.user.user_metadata.name}</div>
              <button
                type="button"
                className={`inline-block rounded bg-slate-600 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white`}
                onClick={onLogout}>
                Logout
              </button>
            </>

            :
            <button
              type="button"
              className={`inline-block rounded bg-slate-600 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white`}
              onClick={() => router.push("/login")}>
              Login
            </button>
        }
      </div>
    </div>

  )
}

export default Header