import nextConnect from "next-connect";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

const apiRoute = nextConnect({
  onError(error, req, res) {
    console.log(error)
    res.status(501).json({ error: `Sorry something Happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method "${req.method}" Not Allowed` });
  },
});

const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => cb(null, file.originalname),
  }),
});

apiRoute.use(upload.single('file'));

apiRoute.post(async (req, res) => {
  const supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_ANON_KEY ?? ''
  );

  const pdfFile = req.file;

  const loader = new PDFLoader(pdfFile.path);
  const docs = await loader.load();
  console.log(docs)

  const vectorStore = await SupabaseVectorStore.fromDocuments(
    docs,
    new OpenAIEmbeddings(),
    {
      client: supabase,
      tableName: "documents",
    }
  );

  res.status(200).json("success")
});

export default apiRoute;

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};