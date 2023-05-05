import React, { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack5';
import { useRouter } from 'next/router';

type Props = {
  file: string
  pageNumber: number
  id: number
}

const PdfViewer = ({ file, pageNumber, id }: Props) => {
  const router = useRouter();

  const [numPages, setNumPages] = useState(0);
  const [currentPageNumber, setCurrentPageNumber] = useState(pageNumber)

  useEffect(() => {
    setCurrentPageNumber(pageNumber);
  }, [id, pageNumber])


  const onPDFLoad = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }

  const onRouterReplace = (page: number) => {
    // When I include router.replace it reloads the entire PDF

    // router.replace({
    //   query: { id, pageNumber: page }
    // })
  }

  const onChangePage = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const pageInput = e.target.value;

    if (isNaN(pageInput)) return;
    if (pageInput < 1) {
      onRouterReplace(1)
      return setCurrentPageNumber(1);
    }
    if (pageInput > numPages) {
      onRouterReplace(numPages)
      return setCurrentPageNumber(numPages);
    }

    onRouterReplace(pageInput)
    return setCurrentPageNumber(parseInt(pageInput));
  }

  const onNext = () => {
    onRouterReplace(currentPageNumber + 1);
    setCurrentPageNumber(curr => ++curr)
  }
  const onPrev = () => {
    onRouterReplace(currentPageNumber - 1);
    setCurrentPageNumber(curr => --curr)
  }

  return (
    <div>
      <Document file={file} onLoadSuccess={onPDFLoad} onLoadError={(err: Error) => console.log(err)}>
        <Page pageNumber={currentPageNumber} renderTextLayer={false} renderAnnotationLayer={false} />
      </Document>
      <div className='flex items-center justify-center'>
        <span onClick={onPrev} className={`${currentPageNumber <= 1 && "invisible"} mr-2 text-4xl cursor-pointer`}>{"<"}</span>
        <span className='mt-2'>Page <input className='w-12 px-1' onChange={onChangePage} value={currentPageNumber}></input> of {numPages}</span>
        <span onClick={onNext} className={`${currentPageNumber >= numPages && "invisible"} ml-2 text-4xl cursor-pointer`}>{">"}</span>
      </div>
    </div>
  )
}

export default PdfViewer