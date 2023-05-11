import React, { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from 'next/router';
import axios, { AxiosRequestConfig } from 'axios';
import Header from '@/components/Header';
import Loader from '@/components/Loader';

import "react-quill/dist/quill.snow.css";

const PdfViewer = dynamic(import("../components/PdfViewer"), { ssr: false });
const ReactQuill = dynamic(import("react-quill"), { ssr: false });

type Documents = {
  id: number;
  content: string;
  file_type: string;
  html_string?: string;
  file_path?: string;
  url?: string;
};

const Documents = () => {
  const router = useRouter();

  const fileInput = useRef({ value: "" });

  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<Array<Documents>>([]);
  const [selectedDocument, setSelectedDocument] = useState<Documents>();
  const [value, setValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<File | null>();

  useEffect(() => {
    axios.get("/api/document").then(({ data }) => {
      setDocuments(data);
    }).catch(console.error)
      .finally(() => setLoadingDocs(false));
  }, []);

  useEffect(() => {
    if (router.query.id && documents.length > 0) {
      const foundDoc = documents.find(
        (d) => d.id === parseInt(router?.query?.id)
      );
      if (foundDoc) {
        if (foundDoc?.file_type === "PDF") {
          axios.get("/api/upload-pdf", { params: { path: foundDoc?.file_path } }).then(({ data }) => {
            setSelectedDocument({ ...foundDoc, url: data });
          });
        } else {
          setSelectedDocument(foundDoc);
          setValue(foundDoc?.html_string || "");
        }
      }
    }
  }, [router.query, documents]);

  const goToDocument = (id: number | null) => {
    if (!id) {
      router.replace({
        query: {}
      })
      setSelectedDocument(undefined);
      setValue("");
      setConfirmDelete(false);
      return;
    }
    const document = documents.find((d) => id === d.id);
    if (document) {
      setConfirmDelete(false);
      router.replace({
        query: { id }
      })
    }
  };

  const onDeleteDocument = async () => {
    if (confirmDelete && selectedDocument) {
      setLoading(true);
      try {
        const { data } = await axios.delete(
          `/api/document/${selectedDocument.id}`
        );
        const newDocuments = [...documents];
        newDocuments.splice(
          newDocuments.findIndex((d) => d.id === data[0].id),
          1
        );
        setDocuments(newDocuments);
        setConfirmDelete(false);
        setSelectedDocument(undefined);
        setValue("");
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    } else {
      setConfirmDelete(true);
    }
  };

  const onAddDocument = async () => {
    setLoading(true);

    try {
      if (selectedDocument) {
        const { data } = await axios.put(
          `/api/document/${selectedDocument.id}`,
          {
            value,
          }
        );

        const newDocuments = [...documents];
        newDocuments.splice(
          newDocuments.findIndex((d) => d.id === data[0].id),
          1,
          data[0]
        );
        setDocuments(newDocuments);

        setValue("");
        setSelectedDocument(undefined);
      } else {
        const { data } = await axios.post("/api/document", { value });
        setDocuments([...documents, data[0]]);
        setValue("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onUploadPDF = async () => {
    setUploading(true)
    if (!selectedPDF) return console.log("Must select a file.");

    let formData = new FormData();
    formData.append("file", selectedPDF);

    try {
      const config: AxiosRequestConfig = {
        headers: { 'content-type': `multipart/form-data` },
        onUploadProgress: (event) => {
          console.log(`Current progress:`, Math.round((event.loaded * 100) / (event?.total || 0)));
        },
      };

      const { data } = await axios.post("/api/upload-pdf", formData, config)
      setSelectedPDF(undefined);
      setDocuments([...documents, data[0]]);
      fileInput.current.value = "";
    } catch (err) {
      console.log(err)
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Header />

      <div className="flex flex-1 items-stretch">
        <div className="w-120 p-4">
          <button
            className={`${!selectedPDF && "cursor-not-allowed"} bg-[#8ebb47] hover:bg-[#65bb44] text-white font-bold py-2 px-4 rounded whitespace-nowrap cursor-pointer`}
            onClick={() => goToDocument(null)}
          >
            {`Create New Document`}
          </button>
          <ul className="mt-3">
            <li
              className={`ml-2 my-1 hover:bg-[#c2d8b9] ${!selectedDocument?.id && " bg-[#e4f0d0]"
                }`}
            ></li>
            {loadingDocs ?
              <div className="flex flex-col items-center">
                <Loader className="fill-white" /> Loading Documents
              </div>

              :
              documents.map((d) => {
                let content_lines = d.content.split("\n");
                let title = content_lines[0];
                return (
                  <li
                    key={d.id}
                    onClick={() => goToDocument(d.id)}
                    className={`pl-2 py-1 cursor-pointer hover:bg-[#c2d8b9] ${selectedDocument?.id === d.id &&
                      "bg-[#e4f0d0]"
                      }`}
                  >
                    <a
                      className="whitespace-normal"
                    >
                      {title}
                    </a>
                  </li>
                );
              })}
          </ul>
        </div>
        <div className="p-4 w-full">
          {
            selectedDocument?.file_type === "PDF" ?
              <PdfViewer
                file={selectedDocument.url || ""}
                pageNumber={parseInt(router?.query?.pageNumber || 1)}
                id={selectedDocument.id}
              />
              :
              <>
                {
                  !selectedDocument && (
                    <div className="text-center">
                      <label className="block mb-4 text-bold">Upload PDF</label>
                      <div className='mb-4 flex flex-row justify-center'>
                        <input ref={fileInput} onChange={(e) => setSelectedPDF(e?.target?.files?.[0])} accept='application/pdf' type='file' />
                        <button
                          disabled={!selectedPDF || uploading}
                          className={`${(!selectedPDF || uploading) && "cursor-not-allowed"} ml-1 block rounded bg-[#738290] px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white`}
                          onClick={onUploadPDF}
                        >
                          <span className="flex items-center">
                            {
                              uploading ? <>
                                <Loader className="mr-2" /> Uploading...
                              </>
                                : "Upload PDF"
                            }
                          </span>
                        </button>
                      </div>
                      <span className="block text-bold text-xl mb-4">-- OR --</span>
                      <label className="block mb-4 text-bold text-center">Create Your Own Document</label>
                    </div>
                  )
                }
                <ReactQuill
                  bounds=".quill"
                  theme="snow"
                  value={value}
                  onChange={setValue}
                />
              </>
          }

          <div>
            {selectedDocument &&
              (confirmDelete ? (
                <div className="float-left block">
                  <span className="text-red-600">
                    {" "}
                    Are you sure you want to delete?{" "}
                  </span>
                  <button
                    className={`mt-2 block rounded bg-red-500 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white"
                      }`}
                    onClick={onDeleteDocument}
                  >
                    <span className="flex items-center">
                      {loading ? (
                        <>
                          <Loader className="mr-2" /> Processing...
                        </>
                      ) : (
                        "Confirm Delete"
                      )}
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  className="mt-2 float-left inline-block rounded bg-red-500 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white"
                  onClick={onDeleteDocument}
                >
                  Delete
                </button>
              ))}

            {
              selectedDocument?.file_type !== "PDF" && (
                <button
                  className={`mt-2 float-right inline-block rounded bg-[#738290] px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white ${loading && "cursor-not-allowed"
                    }`}
                  disabled={loading}
                  onClick={onAddDocument}
                >
                  <span className="flex items-center">
                    {loading ? (
                      <>
                        <Loader className="mr-2" /> Processing...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </span>
                </button>
              )
            }
          </div>
        </div>
      </div>
    </div >
  )
}

export default Documents
