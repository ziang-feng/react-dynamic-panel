import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DivisionDirection, PageData, PageID } from '../../types/workspaceTypes';


export function CloseTabConfirmation({dismissCallback, closePageCallback, closedPageData}:{dismissCallback:()=>void, closePageCallback:(pageData:PageData)=>void, closedPageData:PageData}) {
    return (
        <div className="flex flex-col">
            <div className='p-6 flex flex-col'>
                <FontAwesomeIcon className="mx-auto text-8xl mb-4 text-foreground-low-1" icon={faTriangleExclamation} />
                <h5 className="mx-auto text-2xl text-foreground-high-1 mb-2">
                    Do you want to close the page:
                </h5>
                <h5 className="mx-auto text-2xl font-semibold text-foreground-high-1 mb-2">{closedPageData.name}</h5>
                <p className="mx-auto">Closed pages cannot be recovered</p>
            </div>
            <div className='flex flex-row'>
                <button type='button' className="bg-background-low-1 hover:bg-background-high-2 py-2 font-semibold text-danger flex-1" onClick={()=>{closePageCallback(closedPageData)}}>Close Page</button>
                <button type='button' className="bg-background-low-1 hover:bg-background-high-2 py-2 font-semibold flex-1" onClick={dismissCallback}>Cancel</button>
            </div>
            
        </div>
    )
}