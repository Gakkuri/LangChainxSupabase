import React, { useEffect, useState } from 'react'
import axios from 'axios';
import Header from '@/components/Header';
import { useRouter } from 'next/router';

const Login = () => {
  const router = useRouter();


  const onGoogleLogin = async () => {
    try {
      const { data } = await axios.post('/api/server-client');
      console.log(data)
      router.push(data?.url ?? "");
    } catch (err) {
      console.log(err)
    }

  }

  return (
    <div className='h-screen flex items-center justify-center'>
      <button
        type="button"
        className={`inline-block rounded bg-slate-600 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white`}
        onClick={onGoogleLogin}>
        Google Login
      </button>
    </div>
  )
}

export default Login;