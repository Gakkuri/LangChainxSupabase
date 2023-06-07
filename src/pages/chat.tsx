import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

import Loader from "@/components/Loader";
import axios from "axios";
import Header from "@/components/Header";

type Documents = {
  id: number;
  content: string;
  pageContent: string;
  metadata?: {
    document_id: number;
    blobType: string;
    loc?: {
      pageNumber: number;
    };
  };
  embedding: [number];
  html_string: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [question, setQuestion] = useState("");
  const [sourceDocuments, setSourceDocuments] = useState<Array<Documents>>([]);
  const [inflight, setInflight] = useState(false);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Prevent multiple requests at once
      if (inflight) return;

      // Reset output
      setInflight(true);
      setQuestion("");
      setOutput("");

      try {
        const { data } = await axios.post("/api/chat", { input });
        setOutput(data.text);
        setQuestion(input);
        setSourceDocuments(data.sourceDocuments);
        setInput("");
      } catch (error) {
        console.error(error);
      } finally {
        setInflight(false);
      }
    },
    [input, inflight]
  );

  return (
    <>
      <main className="h-screen w-full m-auto lg:w-[1024px]">
        <Header />

        <div className="m-4">
          <form onSubmit={onSubmit} className="flex ">
            <div className="flex w-full mb-4">
              <input
                type="text"
                placeholder="Ask a question across all documents..."
                className="p-2 grow border-2 border-[#738290]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                className={`${
                  inflight && "cursor-not-allowed"
                } flex-none inline-block bg-[#738290] px-6 pb-2 pt-2 text-xs font-medium uppercase leading-normal text-white`}
                type="submit"
              >
                {inflight ? (
                  <div className="flex items-center">
                    <Loader className="mr-2" /> Processing...
                  </div>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </form>
          <div>
            <div className="flex flex-col">
              <span className="font-bold">Question: {question}</span>
              <span className="mb-4">Response: {output}</span>
            </div>

            <h2 className="font-bold text-medium mt-6">Source Documents:</h2>
            {sourceDocuments?.map((sourceDoc, i) => {
              const documentId = sourceDoc?.metadata?.document_id;
              if (documentId) {
                const pageNumber = sourceDoc?.metadata?.loc?.pageNumber;
                const sourceType = sourceDoc?.metadata?.blobType;
                const content = sourceDoc?.pageContent;
                return (
                  <div key={`${documentId}-${i}`}>
                    <div className="inline-block rounded px-4 py-1 my-1 bg-[#e4f0d0] hover:bg-[#c2d8b9] text-xs font-medium">
                      <Link
                        href={{
                          pathname: `/documents/`,
                          query: { id: documentId, pageNumber: pageNumber },
                        }}
                      >
                        {`${
                          sourceType === "application/pdf"
                            ? `PDF Page #${pageNumber}`
                            : "Text"
                        }:
                            ${
                              content.length > 500
                                ? `${content.substring(0, 500)}...`
                                : content
                            }`}
                      </Link>
                    </div>
                  </div>
                );
              }
            })}
            <span></span>
          </div>
        </div>
      </main>
    </>
  );
}
