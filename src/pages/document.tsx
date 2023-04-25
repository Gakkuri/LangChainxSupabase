import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import BackButton from '@/components/BackButton';

type DocumentType = {
    id: "",
    content: "",
    metadata: "",
    embedding: ""
}

const Document = () => {
    const router = useRouter();
    const [documentData, setDocumentData] = useState({
        id: "",
        content: "",
        metadata: "",
        embedding: ""
    });
    const supabase = useSupabaseClient();

    useEffect(() => {
        if (router.query?.id) {
            supabase
                .from('documents')
                .select()
                .eq('id', router.query?.id)
                .then(({ data, error }) => {
                    setDocumentData(data[0]);
                })
        }
    }, [router.query?.id])


    return (
        <div className="m-8">
            <BackButton />
            <h1 className="text-xl font-bold">Document #{documentData.id}</h1>

            <div className="flex flex-col ">
                <h2 className="text-lg font-bold my-4">Details:</h2>
                <span>
                    <label className="mr-2 font-bold">Content:</label>
                    {documentData.content}
                </span>
                <span>
                    <label className="mr-2 font-bold">Metadata:</label>
                    {documentData.metadata}
                </span>
                <span className="break-words">
                    <label className="mr-2 font-bold">Embedding:</label>
                    {documentData.embedding}
                </span>
            </div>

        </div>
    )
}

export default Document