import nextConnect from "next-connect";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "langchain/text_splitter";

const apiRoute = nextConnect({
  onError(error, req, res) {
    console.log(error)
    res.status(501).json({ error: `Sorry something Happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method "${req.method}" Not Allowed` });
  },
});

const upload = multer()

apiRoute.use(upload.single("file"));

apiRoute.post(async (req, res) => {
  const embeddings = new OpenAIEmbeddings();
  const supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_ANON_KEY ?? ''
  );

  // let pdfFile = new Blob(req.file.buffer, { type: 'application/pdf' })
  let pdfFile = req.file;

  console.log(pdfFile)

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
    .download(dataUpload.path)
  // .createSignedUrl(data.path, 60)

  const splitter = new CharacterTextSplitter({
    separator: " ",
    chunkSize: 1000,
    chunkOverlap: 3,
  });

  const loader = new PDFLoader(rawFile);
  const docs = await loader.loadAndSplit(splitter);

  console.log(docs);

  // await SupabaseVectorStore.fromDocuments(
  //   docs,
  //   new OpenAIEmbeddings(),
  //   {
  //     client: supabase,
  //     tableName: "documents",
  //   }
  // );

  const allEmbeddings = await embeddings.embedDocuments(docs.map((doc) => doc.pageContent));

  const { data, error } = await supabase
    .from('documents')
    .insert(docs.map((doc, i) => ({
      content: doc.pageContent,
      embedding: allEmbeddings[i],
      metadata: doc.metadata
    })))
    .select();

  Promise.all(
    data?.map((d) => supabase
      .from('documents')
      .update({ metadata: { id: d.id, path: dataUpload.path, ...d.metadata } })
      .eq('id', d.id))
  )


  res.status(200).json("Upload Success!")
})

export default apiRoute;

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};