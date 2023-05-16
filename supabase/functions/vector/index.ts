import { serve } from "http/server.ts";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { corsHeaders } from "../_shared/cors.ts";

// First, follow set-up instructions at
// https://js.langchain.com/docs/modules/indexes/vector_stores/integrations/supabase

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const embeddings = new OpenAIEmbeddings();
    const { url, fileName, userId } = req.body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );


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

    if (error || errorChunk) throw error || errorChunk

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});