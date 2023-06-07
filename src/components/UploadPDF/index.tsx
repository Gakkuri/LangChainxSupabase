import React, { useState, ComponentPropsWithoutRef } from "react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { TrashIcon } from "@radix-ui/react-icons";
import * as Dialog from "@radix-ui/react-alert-dialog";
import clsx from "clsx";
import axios, { AxiosRequestConfig } from "axios";
import Button from "../shared/Button";
import Loader from "../Loader";

type Documents = {
  id: number;
  content: string;
  file_type: string;
  html_string?: string;
  file_path: string;
  url?: string;
};

type Props = {
  setDocument: React.Dispatch<React.SetStateAction<Array<Documents>>>;
};

const UploadPDF = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>();
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  const onUploadPDF = async () => {
    if (!selectedFile) return setErrorMessage("Must select a file.");

    if (selectedFile.size / (1024 * 1024) > 5.1)
      return setErrorMessage("File must be less than 5mb.");

    setUploading(true);

    try {
      const { data: dataUpload, error: errorUpload } =
        await supabaseClient.storage
          .from("pdf_documents")
          .upload(`public/${selectedFile.name}`, selectedFile, {
            cacheControl: "3600",
            upsert: true,
            contentType: selectedFile.type,
          });

      const {
        data: { docs },
      } = await axios.post("/api/upload-pdf", { url: dataUpload?.path });
      const { data } = await axios.post("/api/upload-pdf/embed", {
        docs,
        fileName: selectedFile.name,
        filePath: dataUpload?.path,
      });

      setSelectedFile(undefined);
      props.setDocument((documents) => {
        const newDocs = [...documents, data[0]] as Array<Documents>;
        return newDocs;
      });
      setIsOpen(false);
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
    }
  };

  // return (
  //   <div className='flex justify-center'>
  //     <p className='text-red-500'>{errorMessage}</p>
  //     <div className="max-w-xl">
  //       {
  //         selectedFile ?
  //           <div className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
  //             <span className="flex items-center space-x-2">
  //               <span className="font-medium text-gray-600 text-center">
  //                 <span className='flex items-center mb-2'>
  //                   <span className="mr-2 text-lg">{selectedFile?.name || ""}</span>
  //                   <TrashIcon width={18} height={18} onClick={() => { setSelectedFile(null); setErrorMessage("") }} />
  //                 </span>

  //                 {
  //                   uploading ?
  //                     <div className='flex'>
  //                       <Loader className="mr-2" /> Uploading...
  //                     </div>
  //                     :
  //                     <Button onClick={onUploadPDF}>Upload Document</Button>
  //                 }
  //               </span>
  //             </span>
  //           </div>
  //           :
  //           <label
  //             className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">

  //             <span className="flex items-center space-x-2">
  //               <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24"
  //                 stroke="currentColor" stroke-width="2">
  //                 <path stroke-linecap="round" stroke-linejoin="round"
  //                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  //               </svg>
  //               <span className="font-medium text-gray-600">
  //                 {"Drop PDF files to upload, or "}
  //                 <span className="text-blue-600 underline">Browse PDF</span>
  //               </span>
  //             </span>
  //             <input onChange={(e) => setSelectedFile(e?.target?.files?.[0])} type="file" accept='application/pdf' className="hidden" />
  //           </label>
  //       }
  //     </div>
  //   </div>

  // )

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild className={props.className}>
        <Button>Upload PDF</Button>
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
            "bg-white dark:bg-gray-800"
          )}
        >
          <Dialog.Title className="text-lg font-bold text-center">
            Upload a PDF file
          </Dialog.Title>
          <Dialog.Description className="mt-6 text-sm text-center font-normal text-gray-700 dark:text-gray-400">
            <p className="text-red-500">{errorMessage}</p>
            <div className="max-w-xl">
              {selectedFile ? (
                <div className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                  <span className="flex items-center space-x-2">
                    <span className="font-medium text-gray-600 text-center">
                      <span className="flex items-center mb-2">
                        <span className="mr-2 text-lg">
                          {selectedFile?.name || ""}
                        </span>
                        <TrashIcon
                          width={18}
                          height={18}
                          onClick={() => {
                            setSelectedFile(null);
                            setErrorMessage("");
                          }}
                        />
                      </span>

                      {uploading ? (
                        <div className="flex">
                          <Loader className="mr-2" /> Uploading...
                        </div>
                      ) : (
                        <Button onClick={onUploadPDF}>Upload Document</Button>
                      )}
                    </span>
                  </span>
                </div>
              ) : (
                <label className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                  <span className="flex items-center space-x-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="font-medium text-gray-600">
                      {"Drop PDF files to upload, or "}
                      <span className="text-blue-600 underline">
                        Browse PDF
                      </span>
                    </span>
                  </span>
                  <input
                    onChange={(e) => setSelectedFile(e?.target?.files?.[0])}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default UploadPDF;
