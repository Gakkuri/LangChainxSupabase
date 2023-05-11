import nextConnect from "next-connect";
import multer from "multer";
// import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import type { NextApiRequest, NextApiResponse } from 'next';

const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(501).json({ error: `Sorry something Happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method "${req.method}" Not Allowed` });
  },
});

const upload = multer()

apiRoute.use(upload.single("file"));

apiRoute.get(async (req, res) => {
  // const supabase = createClient(
  //   process.env.SUPABASE_URL ?? '',
  //   process.env.SUPABASE_ANON_KEY ?? ''
  // );

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

  const { path } = req.query;

  const { data, error } = await supabase
    .storage
    .from('pdf_documents')
    .createSignedUrl(path, 300)

  if (error) res.status(500).json(error)
  else res.status(200).json(data.signedUrl)
})

apiRoute.post(async (req, res) => {
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

  let pdfFile = req.file;

  const userId = session.user.id;

  const { data: dataUpload, error: errorUpload } = await supabase
    .storage
    .from('pdf_documents')
    .upload(`public/${pdfFile.originalname}`, pdfFile.buffer, {
      cacheControl: '3600',
      upsert: true,
      contentType: pdfFile.mimetype
    })

  const { data: rawFile, error: errorDownload } = await supabase
    .storage
    .from('pdf_documents')
    .download(dataUpload?.path || "")
  // .createSignedUrl(data.path, 60)

  const splitter = new RecursiveCharacterTextSplitter();
  const loader = new PDFLoader(rawFile || "");
  const docs = await loader.loadAndSplit(splitter);

  const insertDocument = {
    user_id: userId,
    content: pdfFile.originalname,
    file_type: "PDF",
    file_path: dataUpload?.path
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
})

export default apiRoute;

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};