import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import type { NextApiRequest, NextApiResponse } from 'next';

type Documents = {
  id: number;
  content: string;
  file_type: string;
  html_string?: string;
  file_path?: string;
  url?: string;
  pageContent?: string;
  metadata?: {};
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { docs } = req.body;

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

  const embeddings = new OpenAIEmbeddings();
  const allEmbeddings = await embeddings.embedDocuments(docs.map((doc: Documents) => (doc.pageContent || "").replace(/\u0000/g, '')));

  res.status(200).json({ embeddings: allEmbeddings })
}