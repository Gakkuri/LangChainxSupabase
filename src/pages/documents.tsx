import React, { useEffect, useState } from 'react';
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from 'next/router';
import ReactQuill from 'react-quill';
import { convert } from 'html-to-text';
import { Configuration, OpenAIApi } from 'openai'

import BackButton from '@/components/BackButton';

import 'react-quill/dist/quill.snow.css';

const Documents = () => {
	const router = useRouter();
	const supabase = useSupabaseClient();
	const configuration = new Configuration({ apiKey: process.env.NEXT_PUBLIC_API_KEY })
	const openAi = new OpenAIApi(configuration)

	const [documents, setDocuments] = useState([]);
	const [selectedDocument, setSelectedDocument] = useState();
	const [value, setValue] = useState("");
	const [confirmDelete, setConfirmDelete] = useState(false);

	useEffect(() => {
		supabase
			.from('documents')
			.select()
			.then(({ data, error }) => {
				setDocuments(data);
			})
	}, [])

	const goToDocument = (id) => {
		const document = documents.find(d => id === d.id);
		setSelectedDocument(document);
		setValue(document.html_string);
	}

	const onDeleteDocument = async () => {
		if (confirmDelete) {
			const { data, error } = await supabase
				.from('documents')
				.delete()
				.eq('id', selectedDocument.id)
				.select()

			setConfirmDelete(false);
			setSelectedDocument(false);
			setValue("");

			const newDocuments = [...documents];
			newDocuments.splice(newDocuments.findIndex(d => d.id === data[0].id), 1)
			setDocuments(newDocuments);

			if (error) return console.error("Something went wrong!", error);
			return console.log("Success!");
		}

		return setConfirmDelete(true);
	}

	const onAddDocument = async () => {
		try {
			const input = value.replace(/\n/g, ' ')

			const embeddingResponse = await openAi.createEmbedding({
				model: 'text-embedding-ada-002',
				input,
			})

			if (selectedDocument) {
				const updates = {
					content: convert(input),
					embedding: embeddingResponse.data.data[0].embedding,
					html_string: value
				}

				const { data, error } = await supabase
					.from('documents')
					.update(updates)
					.eq('id', selectedDocument.id)
					.select();

				const newDocuments = [...documents];
				newDocuments.splice(newDocuments.findIndex(d => d.id === data[0].id), 1, data[0])
				setDocuments(newDocuments);

				setValue("");
				setSelectedDocument(false);
				if (error) return console.error("Something went wrong!", error);
			} else {
				const id = Math.floor(Date.now() / 1000);

				const insert = {
					id,
					metadata: { id },
					content: convert(input),
					embedding: embeddingResponse.data.data[0].embedding,
					html_string: value
				}

				const { data, error } = await supabase
					.from('documents')
					.insert(insert)
					.select();

				setDocuments([...documents, data[0]]);
				setValue("");

				if (error) return console.error("Something went wrong!", error);
			}
			return console.log("Success!");

		} catch (err) {
			console.error(err);
		}
	}

	return (
		<div className="m-8">
			<div className="flex justify-between mb-4">
				<BackButton />
				{/* <button
					type="button"
					className="inline-block rounded bg-slate-600 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:bg-primary-600 hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:bg-primary-600 focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:bg-primary-700 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]"
					onClick={() => router.push("/embed")}>
					Create Document
				</button> */}
			</div>

			<div className="flex flex-1 items-stretch">
				<div className='w-100 border-r-2 border-slate-400 p-4'>
					<h1 className="text-lg font-bold"> Document List</h1>
					<table className="border-collapse border border-slate-500 w-full">
						<thead>
							<tr>
								<th className="border border-slate-600 bg-stone-500">ID</th>
								<th className="border border-slate-600 bg-stone-500">Content</th>
							</tr>
						</thead>
						<tbody>
							{
								documents.map(d => (
									<tr onClick={() => goToDocument(d.id)} key={d.id}>
										<td className="border border-slate-700">{d.id}</td>
										<td className="border border-slate-700">{d.content.length > 20 ? `${d.content.substring(0, 20)}...` : d.content}</td>
									</tr>
								))
							}
						</tbody>
					</table>
				</div>
				<div className='p-4 w-full'>
					<h1 className='text-lg font-bold'>Text Editor </h1>
					<ReactQuill bounds=".quill" theme="snow" value={value} onChange={setValue} />
					<div>
						{
							selectedDocument &&
							(
								confirmDelete ?
									<div className='float-left block'>
										<span className='text-red-600'> Are you sure you want to delete? </span>
										<button className="mt-2 block rounded bg-red-500 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:bg-primary-600 hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:bg-primary-600 focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:bg-primary-700 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]"
											onClick={onDeleteDocument}>
											Confirm Delete
										</button>
									</div>
									:
									<button className="mt-2 float-left inline-block rounded bg-red-500 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:bg-primary-600 hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:bg-primary-600 focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:bg-primary-700 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]"
										onClick={onDeleteDocument}>
										Delete
									</button>
							)
						}

						<button className="mt-2 float-right inline-block rounded bg-slate-600 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:bg-primary-600 hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:bg-primary-600 focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:bg-primary-700 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]"
							onClick={onAddDocument}>
							Submit
						</button>
					</div>

				</div>
			</div>

		</div>
	)
}

export default Documents