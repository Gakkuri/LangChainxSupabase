import React, {
  useState,
  ComponentPropsWithoutRef,
  useRef,
  useEffect,
} from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/router";
import { useSession } from "@supabase/auth-helpers-react";
import * as Dialog from "@radix-ui/react-alert-dialog";
import clsx from "clsx";
import axios from "axios";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

const GoProDialog = (props: ComponentPropsWithoutRef<"a">) => {
  const router = useRouter();
  const session = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const onCheckout = async () => {
    const { data } = await axios.post("/api/server-client", {
      isCheckout: true,
    });
    router.push(data?.url ?? "");
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild className={props.className}>
        <a className="cursor-pointer">{props.children || "Upgrade"}</a>
      </Dialog.Trigger>

      <Dialog.Portal>
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
            Upgrade to plus version
          </Dialog.Title>
          <Dialog.Description
            className={clsx(
              "w-full flex flex-nowrap justify-between items-stretch space-x-4",
              "mt-6 text-sm font-normal text-gray-700 dark:text-gray-400"
            )}
          >
            <div
              className={clsx(
                "block border rounded border-slate-400",
                "basis-1/2"
              )}
            >
              <div className={clsx("block border-b border-slate-400 p-4")}>
                Free
              </div>
              <div className={clsx("block p-4")}>
                <h1>$0 /mo</h1>
                <ul className="list-disc ml-6">
                  <li>120 pages /PDF</li>
                  <li>5 MB /PDF</li>
                  <li>3 Documents</li>
                  <li>50 questions /day</li>
                </ul>
              </div>
            </div>

            <div
              className={clsx(
                "block border rounded border-slate-400",
                "basis-1/2"
              )}
            >
              <div className={clsx("block border-b border-slate-400 p-4")}>
                Plus
              </div>
              <div className={clsx("block p-4")}>
                <h1>$5 /mo</h1>
                <ul className="list-disc ml-6">
                  <li>2,000 pages /PDF</li>
                  <li>32 MB /PDF</li>
                  <li>50 Documents</li>
                  <li>1000 questions /day</li>
                </ul>
              </div>
              <div className={clsx("block border-t border-slate-400 p-4")}>
                {session ? (
                  <form action="/api/stripe/checkout" method="POST">
                    <input
                      className="invisible"
                      name="redirectUrl"
                      id="redirectUrl"
                      defaultValue={router.pathname}
                    />
                    <input
                      className="invisible"
                      name="email"
                      id="email"
                      defaultValue={session.user.email}
                    />
                    <button
                      type="submit"
                      role="link"
                      className={clsx(
                        "inline-flex items-center w-full select-none justify-center rounded-md px-4 py-2 font-medium",
                        "bg-white text-gray-900 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-100 hover:dark:bg-gray-600",
                        "border border-gray-300 dark:border-transparent"
                      )}
                    >
                      Get Plus
                    </button>
                  </form>
                ) : (
                  <form onClick={onCheckout} method="POST">
                    <button
                      type="submit"
                      role="link"
                      className={clsx(
                        "inline-flex items-center w-full select-none justify-center rounded-md px-4 py-2 font-medium",
                        "bg-white text-gray-900 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-100 hover:dark:bg-gray-600",
                        "border border-gray-300 dark:border-transparent"
                      )}
                    >
                      Get Plus
                    </button>
                  </form>
                )}
              </div>
            </div>
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default GoProDialog;
