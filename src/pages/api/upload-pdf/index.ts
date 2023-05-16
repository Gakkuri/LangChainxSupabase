import nextConnect from "next-connect";
import multer from "multer";
// import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url, fileName } = req.body;
  const embeddings = new OpenAIEmbeddings();

  const supabase = createServerSupabaseClient({
    req, res
  })

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return res.status(401).json({
      error: 'not_authenticated',
      description: 'The user does not have an active session or is not authenticated',
    })

  const userId = session.user.id;
  const { data: rawFile, error: errorDownload } = await supabase
    .storage
    .from('pdf_documents')
    .download(url)

  const splitter = new RecursiveCharacterTextSplitter();
  const loader = new PDFLoader(rawFile || "");
  const docs = await loader.loadAndSplit(splitter);

  const insertDocument = {
    user_id: userId,
    content: fileName,
    file_type: "PDF",
    file_path: url
  }

  const allEmbeddings = await embeddings.embedDocuments(docs.map((doc) => doc.pageContent.replace(/\u0000/g, '')));

  const { data, error } = await supabase
    .from('documents')
    .insert(insertDocument)
    .select();

  const { error: errorChunk } = await supabase
    .from('chunks')
    .insert(docs.map((doc, i) => ({
      user_id: userId,
      content: doc.pageContent.replace(/\u0000/g, ''),
      embedding: allEmbeddings[i],
      document_id: data?.[0].id,
      metadata: {
        ...doc.metadata,
        document_id: data?.[0].id,
      }
    })).filter(doc => !!doc))

  if (error || errorChunk) return res.status(500).json(error?.message || errorChunk?.message)

  res.status(200).json(data)
}