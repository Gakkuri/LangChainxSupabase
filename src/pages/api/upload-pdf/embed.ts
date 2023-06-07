import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import type { NextApiRequest, NextApiResponse } from "next";

type Documents = {
  id: number;
  content: string;
  file_type: string;
  html_string?: string;
  file_path?: string;
  url?: string;
  pageContent?: string;
  metadata?: {};
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { docs, fileName, filePath } = req.body;

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

  const user_id = session?.user.id;
  const embeddings = new OpenAIEmbeddings();
  const allEmbeddings = await embeddings.embedDocuments(
    docs.map((doc: Documents) => (doc.pageContent || "").replace(/\u0000/g, ""))
  );

  const insertDocument = {
    user_id,
    content: fileName,
    file_type: "PDF",
    file_path: filePath,
  };

  const { data, error } = await supabase
    .from("documents")
    .insert(insertDocument)
    .select();

  const { error: errorChunk } = await supabase.from("chunks").insert(
    docs
      .map((doc: Documents, i: number) => ({
        user_id,
        content: (doc.pageContent || "").replace(/\u0000/g, ""),
        embedding: allEmbeddings[i],
        document_id: data?.[0].id,
        metadata: {
          ...doc.metadata,
          document_id: data?.[0].id,
        },
      }))
      .filter((doc: Document) => !!doc)
  );

  if (error || errorChunk) return res.status(500).json(error || errorChunk);

  res.status(200).json(data);
}
