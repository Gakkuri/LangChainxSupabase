import React, { ComponentPropsWithoutRef } from 'react'
import clsx from 'clsx';

const Button = (props: ComponentPropsWithoutRef<'button'>) => {
  return (
    <button
      {...props}
      className={clsx(
        props.className,
        "block rounded bg-[#738290] px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white"
      )}
    >
      {props.children}
    </button>
  )
}

export default Button