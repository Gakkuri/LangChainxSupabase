import { serve } from "http/server.ts";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { createClient } from "@supabase/supabase-js";
import { SupabaseHybridSearch } from "langchain/retrievers/supabase";
import { OpenAI } from "langchain/llms/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { corsHeaders } from "../_shared/cors.ts";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

// First, follow set-up instructions at
// https://js.langchain.com/docs/modules/indexes/vector_stores/integrations/supabase

const privateKey = Deno.env.get("SUPABASE_PRIVATE_KEY");
if (!privateKey) throw new Error(`Expected env var SUPABASE_PRIVATE_KEY`);

const url = Deno.env.get("SUPABASE_URL");
if (!url) throw new Error(`Expected env var SUPABASE_URL`);

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }
    try {
        const data = await req.json();

        // console.log(data)

        var url = "https://marinmg.ucanr.edu/files/187894.pdf";

        const loader = new PDFLoader(url, {
            splitPages: false,
        });
        const docs = await loader.load();
        console.log(docs)

        return new Response(JSON.stringify(docs), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});