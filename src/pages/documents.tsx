import React, { useEffect, useState, useCallback } from 'react';
import dynamic from "next/dynamic";
import { useRouter } from 'next/router';
import axios, { AxiosRequestConfig } from 'axios';

import { PDFLoader } from "langchain/document_loaders/fs/pdf";

import Header from '@/components/Header';
import Loader from '@/components/Loader';

import 'react-quill/dist/quill.snow.css';
import 'quill-mention/dist/quill.mention.css';

const QuillMention = dynamic(import('quill-mention'), { ssr: false });
const ReactQuill = dynamic(import('react-quill'), { ssr: false });

type Documents = {
  id: number
  content: string
  metadata?: { id: number }
  embedding: [number]
  html_string: string
}

const atValues = [
  { id: 1, value: "At Value 1" },
  { id: 2, value: "At Value 2" },
];
const hashValues = [
  { id: 3, value: "Hash Value 1" },
  { id: 4, value: "Hash Value 2" },
  { id: 5, value: "Story" },
];

const Documents = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Array<Documents>>([]);
  const [selectedDocument, setSelectedDocument] = useState<Documents>();
  const [value, setValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState();

  useEffect(() => {
    axios.get("/api/document").then(({ data }) => {
      setDocuments(data);
    })
  }, [])

  useEffect(() => {
    if (router.query.id && documents.length > 0) {
      const foundDoc = documents.find((d) => d.id === parseInt(router.query.id));
      if (foundDoc) {
        setSelectedDocument(foundDoc);
        setValue(foundDoc.html_string);
      }
    }
  }, [router.query, documents])

  useEffect(() => {
    window.addEventListener('mention-hovered', (event) => { console.log('hovered: ', event) }, false);
    window.addEventListener('mention-clicked', (event) => { console.log('clicked: ', event) }, false);
    return () => {
      window.removeEventListener('mention-hovered', (event) => { console.log('hovered: ', event) });
      window.removeEventListener('mention-clicked', (event) => { console.log('clicked: ', event) });
    }
  }, [])


  const goToDocument = (id: number | null) => {
    if (!id) {
      router.replace({
        query: {}
      })
      setSelectedDocument(undefined);
      setValue("");
      return;
    }
    const document = documents.find(d => id === d.id);
    if (document) {
      router.replace({
        query: { id }
      })
    }
  }

  const onDeleteDocument = async () => {
    if (confirmDelete && selectedDocument) {
      setLoading(true);
      try {
        const { data } = await axios.delete(`/api/document/${selectedDocument.id}`)
        const newDocuments = [...documents];
        newDocuments.splice(newDocuments.findIndex(d => d.id === data[0].id), 1)
        setDocuments(newDocuments);
        setConfirmDelete(false);
        setSelectedDocument(undefined);
        setValue("");
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    } else {
      setConfirmDelete(true);
    }
  }

  const onAddDocument = async () => {
    setLoading(true);

    try {
      if (selectedDocument) {
        const { data } = await axios.put(`/api/document/${selectedDocument.id}`, {
          value
        })

        const newDocuments = [...documents];
        newDocuments.splice(newDocuments.findIndex(d => d.id === data[0].id), 1, data[0])
        setDocuments(newDocuments);

        setValue("");
        setSelectedDocument(undefined);
      } else {
        const { data } = await axios.post("/api/document", { value })
        setDocuments([...documents, data[0]]);
        setValue("");
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const mentionModule = {
    allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
    mentionDenotationChars: ['@', '#'],
    source: useCallback(
      (
        searchTerm: string,
        renderItem: (
          arg0: { id: number; value: string }[] | undefined,
          arg1: any
        ) => void,
        mentionChar: string
      ) => {
        let values;

        if (mentionChar === '@') {
          values = atValues;
        } else if (mentionChar === '#') {
          values = hashValues;
        }

        if (searchTerm.length === 0) {
          renderItem(values, searchTerm);
        } else if (values) {
          const matches = [];
          for (let i = 0; i < values.length; i += 1)
            if (
              values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())
            )
              matches.push(values[i]);
          renderItem(matches, searchTerm);
        }
      },
      []
    ),
  }

  const onUploadPDF = async () => {
    let formData = new FormData();
    formData.append("file", selectedPDF);

    const config: AxiosRequestConfig = {
      headers: { 'content-type': `multipart/form-data` },
      onUploadProgress: (event) => {
        console.log(`Current progress:`, Math.round((event.loaded * 100) / event.total));
      },
    };

    axios.post("/api/upload-pdf", formData, config)
      .then(console.log)
      .catch(console.error)
  }

  return (
    <div className="m-8">
      <Header />

      <div className="flex flex-1 items-stretch">
        <div className='w-300 border-r-2 border-slate-400 p-4'>
          <h1 className="text-lg font-bold mb-3"> Document List</h1>
          <ul>
            <li className={`border-l-2 pl-2 py-1 hover:border-cyan-300 hover:text-cyan-300 ${!selectedDocument?.id && "border-cyan-500 text-cyan-500"}`}>
              <a onClick={() => goToDocument(null)} className="whitespace-nowrap cursor-pointer">
                {`+ Create New Document`}
              </a>
            </li>
            {
              documents.map((d) =>
                <li key={d.id} className={`border-l-2 pl-2 py-1 hover:border-cyan-300 hover:text-cyan-300 ${selectedDocument?.id === d.id && "border-cyan-500 text-cyan-500"}`}>
                  <a onClick={() => goToDocument(d.id)} className="whitespace-nowrap cursor-pointer">
                    <label className='mr-2'>{`${d.id} ~`}</label>
                    {d.content.length > 20 ? `${d.content.substring(0, 20)}...` : d.content}
                  </a>
                </li>
              )
            }
          </ul>
        </div>
        <div className='p-4 w-full'>
          <ReactQuill
            bounds=".quill"
            theme="snow"
            value={value}
            onChange={setValue}
            modules={{
              mention: mentionModule
            }}
          />
          <div>
            {
              selectedDocument &&
              (
                confirmDelete ?
                  <div className='float-left block'>
                    <span className='text-red-600'> Are you sure you want to delete? </span>
                    <button className={`mt-2 block rounded bg-red-500 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white`}
                      onClick={onDeleteDocument}>
                      <span className='flex items-center'>
                        {
                          loading ? <><Loader className="mr-2" /> Processing...</> : "Confirm Delete"
                        }
                      </span>
                    </button>
                  </div>
                  :
                  <button className="mt-2 float-left inline-block rounded bg-red-500 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white"
                    onClick={onDeleteDocument}>
                    Delete
                  </button>
              )
            }

            <button className={`mt-2 float-right inline-block rounded bg-slate-600 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white`}
              disabled={loading}
              onClick={onAddDocument}>
              <span className='flex items-center'>
                {
                  loading ? <><Loader className="mr-2" /> Processing...</> : "Submit"
                }
              </span>

            </button>
            <input onChange={(e) => setSelectedPDF(e.target.files[0])} accept='application/pdf' type='file' />
            <button
              className='block rounded bg-slate-600 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white'
              onClick={onUploadPDF}
            >Test PDF</button>

          </div>
        </div>
      </div>
    </div >
  )
}

export default Documents