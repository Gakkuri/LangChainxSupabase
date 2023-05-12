import React, { useState, ComponentPropsWithoutRef } from 'react'
import Image from 'next/image';
import { useRouter } from 'next/router';
import * as Dialog from "@radix-ui/react-alert-dialog";
import GoogleIcon from '@/assets/googleicon.svg';
import clsx from 'clsx';
import axios from 'axios';

const LoginDialog = (props: ComponentPropsWithoutRef<'a'>) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const onGoogleLogin = async () => {
    try {
      const { data } = await axios.post('/api/server-client');
      router.push(data?.url ?? "");
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>

      <Dialog.Trigger asChild className={props.className}>
        <a className='cursor-pointer'>{props.children || "Get Started"}</a>
        {/* <a
          className='cursor-pointer'
          onClick={() => setIsOpen(true)}>
          Login
        </a> */}
      </Dialog.Trigger>

      <Dialog.Portal >
        <Dialog.Overlay
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-20 bg-black/50"
        />
        <Dialog.Content
          className={clsx(
            "fixed z-50",
            "w-[95vw] max-w-md rounded-lg p-4 md:w-full",
            "top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%]",
            "bg-white dark:bg-gray-800",
            "focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75"
          )}
        >
          <Dialog.Title className="text-lg font-bold text-center">
            Login
          </Dialog.Title>
          <Dialog.Description className="mt-6 text-sm font-normal text-gray-700 dark:text-gray-400">
            <button
              onClick={onGoogleLogin}
              className={clsx(
                "inline-flex items-center w-full select-none justify-center rounded-md px-4 py-2 font-medium",
                "bg-white text-gray-900 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-100 hover:dark:bg-gray-600",
                "border border-gray-300 dark:border-transparent"
              )}
            >
              <Image className='mr-2' width={20} height={20} src={GoogleIcon} alt="google icon" /> Sign in with Google
            </button>
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default LoginDialog