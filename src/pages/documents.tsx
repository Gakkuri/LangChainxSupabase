/* eslint-disable react/display-name */

import React, { useEffect, useState, useRef } from "react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import axios, { AxiosRequestConfig } from "axios";
import clsx from "clsx";
import Header from "@/components/Header";
import Loader from "@/components/Loader";

import "react-quill/dist/quill.snow.css";
import UploadPDF from "@/components/UploadPDF";
import { useSession } from "@supabase/auth-helpers-react";
import Button from "@/components/shared/Button";

const PdfViewer = dynamic(() => import("../components/PdfViewer"), {
  ssr: false,
});
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill");
    return ({ forwardedRef, ...props }) => <RQ ref={forwardedRef} {...props} />;
  },
  { ssr: false }
);
// import ReactQuill, { Quill } from 'react-quill';

const FREE_ACCOUNT_MAX_DOCUMENTS = 10;

type Document = {
  id: number;
  content: string;
  file_type: string;
  html_string?: string;
  file_path: string;
  url?: string;
};

function SaveButton(props: { saveAction: any; loading: boolean }) {
  return (
    <button
      className={`mt-2 inline-block rounded bg-[#738290] px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white ${
        props.loading && "cursor-not-allowed"
      }`}
      disabled={props.loading}
      onClick={() => props.saveAction()}
    >
      <span className="flex items-center">
        {props.loading ? (
          <>
            <Loader className="mr-2" /> Processing...
          </>
        ) : (
          "Save"
        )}
      </span>
    </button>
  );
}

function LeftPane(props: {
  currentDocument?: Document;
  loadingDocs: boolean;
  documents: Array<Document>;
  goToDocument: any;
}) {
  return (
    <div>
      <button
        className={`bg-[#8ebb47] hover:bg-[#65bb44] text-white font-bold py-2 px-4 rounded whitespace-nowrap cursor-pointer`}
        onClick={() => props.goToDocument(null)}
      >
        {`Create Documents`}
      </button>
      <ul className="mt-3">
        <li
          className={`ml-2 my-1 hover:bg-[#c2d8b9] ${
            !props.currentDocument?.id && " bg-[#e4f0d0]"
          }`}
        ></li>
        {props.loadingDocs ? (
          <div className="flex flex-col items-center">
            <Loader className="fill-white" /> Loading Documents
          </div>
        ) : (
          props.documents.map((d) => {
            let content_lines = d.content.split("\n");
            let title = content_lines[0];
            return (
              <li
                key={d.id}
                onClick={() => props.goToDocument(d.id)}
                className={`pl-2 py-1 break-words cursor-pointer hover:bg-[#c2d8b9] ${
                  props.currentDocument?.id === d.id && "bg-[#e4f0d0]"
                }`}
              >
                <a className="whitespace-normal">{title}</a>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function ViewDocumentContainer(props: {
  currentDocument: Document;
  loading: boolean;
  value: any;
  setValue: any;
  confirmDelete: boolean;
  onDeleteDocument: any;
  loadingAutoSave: boolean;
  setLoadingAutoSave: any;
  updateDocument: any;
}) {
  const router = useRouter();
  const quillRef = useRef(); // Create a reference to store the Quill instance.
  const [timeoutId, setTimeoutId] = useState<any>(null);

  const handleChange = (content: string) => {
    if (!quillRef.current) return;
    const quillInstance = quillRef.current.getEditor();

    // Clear any existing timeouts to prevent overlapping save calls.
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new Data Value
    props.setValue(content);

    // Set a new timeout.
    const newTimeoutId = setTimeout(async () => {
      // Get cursor location
      const range = quillInstance.getSelection();
      // Disable the editor.
      quillInstance.enable(false);

      // Save your data here.
      props.setLoadingAutoSave(true);
      await props.updateDocument(props.currentDocument, content);

      // Enable the editor and put cursor to the right place after saving.
      quillInstance.enable(true);
      quillInstance.setSelection(range);
    }, 2000); // Set delay of 2 seconds.

    // Save the timeout ID for later so we can clear it.
    setTimeoutId(newTimeoutId);
  };

  const viewDocumentByType = (currentDocument?: Document) => {
    switch (currentDocument?.file_type) {
      case "PDF":
        return (
          <PdfViewer
            file={currentDocument.url || ""}
            pageNumber={Number(router?.query?.pageNumber || 1)}
            id={currentDocument.id}
          />
        );
      case "URL":
        return (
          <a className="color-blue" href={currentDocument.content}>
            {currentDocument.content}
          </a>
        );
      default:
        return (
          <div className="editor-container relative">
            {/* Adding Disabled Overlay */}
            <div
              className={
                !props.loadingAutoSave
                  ? "hidden"
                  : "flex justify-center items-center absolute top-0 left-0 w-full h-full bg-gray-900 opacity-70 cursor-not-allowed z-1"
              }
            >
              <Loader className="invert" w={40} h={40} />
            </div>

            {/* Text Editor */}
            <ReactQuill
              forwardedRef={(el) => (quillRef.current = el)}
              bounds=".quill"
              theme="snow"
              value={props.value}
              onChange={handleChange}
              className="quill-disabled"
            />
          </div>
        );
    }
  };
  return (
    <div>
      {/* VIEW DOCUMENT CONTAINER */}
      {viewDocumentByType(props.currentDocument)}

      {/* DELETE CONTAINER */}
      <div className="flex justify-between items-center">
        {props.confirmDelete ? (
          <div className="">
            <span className="text-red-600">
              Are you sure you want to delete?
            </span>
            <button
              className={`mt-2 block rounded bg-red-500 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal
              text-white`}
              onClick={props.onDeleteDocument}
            >
              <span className="flex items-center">
                {props.loading ? (
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
            className="bg-red-200 hover:bg-red-500 text-white mt-2 float-left inline-block rounded px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal"
            onClick={props.onDeleteDocument}
          >
            Delete
          </button>
        )}

        {props.currentDocument && props.loadingAutoSave && (
          <span className="flex items-center">
            <Loader className="mr-2" /> Saving...
          </span>
        )}
      </div>
    </div>
  );
}

function NewDocumentContainer(props: {
  createDocument: any;
  setDocuments: any;
  value: string;
  setValue: any;
  loading: boolean;
  userDocumentLimitReached: boolean;
}) {
  const [url, setUrl] = useState("");

  if (props.userDocumentLimitReached) {
    return (
      <div>
        <div className="flex flex-col items-center">
          <span className="text-red-600">
            You have exceeded the number of documents you can create. Please
            upgrade your account to create more documents.
          </span>
        </div>
      </div>
    );
  }

  function handleUrlSubmit(_: React.ChangeEvent<HTMLButtonElement>) {
    props.createDocument(url);
    setUrl("");
  }

  return (
    <div>
      {/* TEXT EDITOR */}
      <div>
        <ReactQuill
          bounds=".quill"
          theme="snow"
          value={props.value}
          onChange={props.setValue}
        />
        <SaveButton loading={props.loading} saveAction={props.createDocument} />
      </div>

      <hr className="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700"></hr>

      {/* URL INPUT */}
      <div className="mt-8">
        <label className="block text-bold text-center mb-2">
          Enter a URL to generate a document
        </label>
        <input
          type="text"
          placeholder="Enter URL Here..."
          className="p-2 w-full grow border-2 border-[#738290]"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button onClick={handleUrlSubmit} className="mt-4">
          URL Save
        </Button>
      </div>

      <hr className="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700"></hr>

      {/* PDF UPLOAD */}
      <label className="block text-bold text-center mb-2">
        Upload a PDF file
      </label>
      <div className="flex justify-center">
        <UploadPDF setDocument={props.setDocuments} />
      </div>
    </div>
  );
}

const Documents = () => {
  const router = useRouter();
  const session = useSession();
  // const controllerRef = useRef<AbortController | null>();

  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Array<Document>>([]);
  const [currentDocument, setCurrentDocument] = useState<Document>();
  const [value, setValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadingAutoSave, setLoadingAutoSave] = useState(false);
  const [user, setUser] = useState<{ [x: string]: any } | null>();

  // FIXME: why is this in useState?
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  const userIsUpgraded = user?.upgraded;
  const userDocumentLimitReached =
    !userIsUpgraded && documents.length >= FREE_ACCOUNT_MAX_DOCUMENTS;

  // Reroute anonymous users to "/"
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Note: Must be awaited because useSession can be null on first render
        const { data, error } = await supabaseClient.auth.getSession();
        const { session } = data;
        if (!session) {
          router.push("/");
        }
        setUser(session?.user);
      } catch (err) {
        console.error(err);
      }
    };

    checkSession();
  }, [router]);

  // Retrieve user documents
  useEffect(() => {
    axios
      .get("/api/document")
      .then(({ data }) => {
        setDocuments(data);
      })
      .catch(console.error)
      .finally(() => setLoadingDocs(false));
  }, []);

  // Is this how you get the logged in user?
  // TODO what about this alternative on ln 277?
  // useEffect(() => {
  //   supabaseClient
  //     .from("users")
  //     .select()
  //     .then(({ data, error }) => {
  //       setUser(data?.[0]);
  //     });
  // }, [supabaseClient]);

  useEffect(() => {
    if (router.query.id && documents.length > 0) {
      const routerQueryId = router.query.id;
      const foundDoc = documents.find((d) => d.id === Number(routerQueryId));
      if (foundDoc) {
        if (foundDoc?.file_type === "PDF") {
          getPDFSignedUrl(foundDoc.file_path)
            .then((data) => {
              setCurrentDocument({ ...foundDoc, url: data });
            })
            .catch(console.error);
        } else {
          setCurrentDocument(foundDoc);
          setValue(foundDoc?.html_string || "");
        }
      }
    }
  }, [router.query, documents]);

  // Debounce autosave
  // useEffect(() => {
  //   let debounce: ReturnType<typeof setTimeout>;
  //   if (currentDocument?.file_type === "RICH_TEXT_EDITOR") {
  //     debounce = setTimeout(() => {
  //       setLoadingAutoSave(true);
  //       updateDocument(currentDocument, value);
  //     }, 2000);
  //   }

  //   return () => {
  //     clearTimeout(debounce);
  //   };
  // }, [value]);

  const getPDFSignedUrl = async (path: string) => {
    const { data, error } = await supabaseClient.storage
      .from("pdf_documents")
      .createSignedUrl(path, 300);

    if (error) throw error;
    return data.signedUrl;
  };

  const goToDocument = (id: number | null) => {
    if (!id) {
      router.replace({
        query: {},
      });
      setCurrentDocument(undefined);
      setValue("");
      setConfirmDelete(false);
      return;
    }
    const document = documents.find((d) => id === d.id);
    if (document) {
      setConfirmDelete(false);
      router.replace({
        query: { id },
      });
    } else {
      alert("Document not found");
    }
  };

  const onDeleteDocument = async () => {
    if (confirmDelete && currentDocument) {
      setLoading(true);
      try {
        const { data } = await axios.delete(
          `/api/document/${currentDocument.id}`
        );
        const newDocuments = [...documents].filter((d) => d.id !== data[0].id);
        setDocuments(newDocuments);
        setConfirmDelete(false);
        setCurrentDocument(undefined);
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

  const updateDocument = async (currentDocument: Document, value: string) => {
    try {
      setLoading(true);
      const { data } = await axios.put(`/api/document/${currentDocument.id}`, {
        value,
      });

      // Replace updated document in documents list
      const newDocuments = [...documents];
      newDocuments.splice(
        newDocuments.findIndex((d) => d.id === data[0].id),
        1,
        data[0]
      );
      setDocuments(newDocuments);
      setLoadingAutoSave(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (url?: string) => {
    // If creating a new document, check if user is upgraded, and document length is not too high
    if (
      !currentDocument &&
      !userIsUpgraded &&
      documents.length >= FREE_ACCOUNT_MAX_DOCUMENTS
    ) {
      alert(
        `You already exceeded allowed ${FREE_ACCOUNT_MAX_DOCUMENTS} documents for free tier.`
      );
      return;
    }
    try {
      if (url) {
        const { data } = await axios.post("/api/document", {
          isUrl: true,
          value: url,
        });
        setDocuments([...documents, data[0]]);
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

  return (
    <div>
      {/* HEADER */}
      <Header />

      {/* MAIN */}
      <div className="flex flex-1 items-stretch">
        {/* LEFT PANE */}
        <div className="grow-0 shrink-0 basis-1/4 p-4">
          <LeftPane
            currentDocument={currentDocument}
            loadingDocs={loadingDocs}
            documents={documents}
            goToDocument={goToDocument}
          />
        </div>
        {/* RIGHT PANE */}
        <div className="p-4 grow-0 shrink-0 basis-3/4 ">
          {currentDocument ? (
            <ViewDocumentContainer
              confirmDelete={confirmDelete}
              loading={loading}
              loadingAutoSave={loadingAutoSave}
              setLoadingAutoSave={setLoadingAutoSave}
              onDeleteDocument={onDeleteDocument}
              currentDocument={currentDocument}
              setValue={setValue}
              value={value}
              updateDocument={updateDocument}
            />
          ) : (
            <NewDocumentContainer
              createDocument={createDocument}
              setDocuments={setDocuments}
              loading={loading}
              value={value}
              setValue={setValue}
              userDocumentLimitReached={userDocumentLimitReached}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;
