import React, { useEffect, useState } from 'react';
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from 'next/router';

import Modal from '@/components/modal';
import BackButton from '@/components/BackButton';

const Documents = () => {
	const router = useRouter();
	const supabase = useSupabaseClient();

	const [documents, setDocuments] = useState([]);

	useEffect(() => {
		supabase
			.from('documents')
			.select()
			.then(({ data, error }) => {
				setDocuments(data);
			})
	}, [])

	const goToDocument = (id) => router.push({ pathname: `/document/${id}` })

	return (
		<div className="m-8">
			<div className="flex justify-between mb-4">
				<BackButton />
				<button
					type="button"
					className="inline-block rounded bg-slate-600 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:bg-primary-600 hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:bg-primary-600 focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:bg-primary-700 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]"
					onClick={() => router.push("/embed")}>
					Create Document
				</button>
			</div>


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
								<td className="border border-slate-700">{d.content}</td>
							</tr>
						))
					}
				</tbody>
			</table>
		</div>
	)
}

export default Documents