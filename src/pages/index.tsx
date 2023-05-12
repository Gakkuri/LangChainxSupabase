import React, { useEffect } from 'react'
import Header from '@/components/Header'
import Button from '@/components/shared/Button'
import clsx from 'clsx'

import { useSession, useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import LoginDialog from '@/components/LoginDialog'

const Homepage = () => {
  const user = useUser();
  const session = useSession();
  const router = useRouter();
  // useEffect(() => {
  //   if ((session?.expires_in || 0) >= 3600) router.push('/chat')
  // }, [router, session])

  return (
    <div>
      <Header type="HOME" />
      <section
        className={clsx(
          "text-center p-6",
          "bg-[#e4f0d0]"
        )}
      >
        <h1 className="text-5xl mb-6">Chat with all your documents and notes</h1>
        <h2 className="text-lg mb-6">PDFs, plaintext and more! Chat with your knowledge base.</h2>
        {
          user ?
            <Button
              className="w-48 m-auto"
              onClick={() => router.push('/chat')}
            >
              Get started for free
            </Button>
            :
            <LoginDialog
              className={clsx(
                "w-48 m-auto",
                "block rounded bg-[#738290] px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white"
              )}
            >
              Get started for free
            </LoginDialog>
        }

      </section>
    </div>
  )
}

export default Homepage