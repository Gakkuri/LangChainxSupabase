import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { url } = req.body;

  const supabase = createServerSupabaseClient({
    req,
    res,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return res.status(401).json({
      error: "not_authenticated",
      description:
        "The user does not have an active session or is not authenticated",
    });

  const { data: rawFile, error: errorDownload } = await supabase.storage
    .from("pdf_documents")
    .download(url);

  const splitter = new RecursiveCharacterTextSplitter();
  const loader = new PDFLoader(rawFile || "");
  const docs = await loader.loadAndSplit(splitter);

  res.status(200).json({ docs });
}
