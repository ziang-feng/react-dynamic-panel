import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageData } from '../../types/workspaceTypes';


export function ClosePageConfirmation({dismissCallback, closePageCallback, closedPageData}:{dismissCallback:()=>void, closePageCallback:(pageData:PageData)=>void, closedPageData:PageData}) {
    return (
        <div className="flex flex-col" style={{maxWidth:"34rem"}}>
            <div className='p-6 flex flex-col'>
                <FontAwesomeIcon className="mx-auto text-8xl mb-4 text-foreground-low-1" icon={faTriangleExclamation} />
                <h5 className="mx-auto text-2xl text-foreground-high-1 mb-2">
                    Do you want to close the page:
                </h5>
                <h5 className="mx-auto text-2xl font-semibold text-foreground-high-1 mb-2">{closedPageData.name}</h5>
                <p className="mx-auto">Closed pages cannot be recovered</p>
            </div>
            <div className='flex flex-row'>
                <button type='button' className="bg-background-low-1 hover:bg-background-high-2 py-2 font-semibold text-danger flex-1" onClick={()=>{dismissCallback();closePageCallback(closedPageData);}}>Close Page</button>
                <button type='button' className="bg-background-low-1 hover:bg-background-high-2 py-2 font-semibold flex-1" onClick={dismissCallback}>Cancel</button>
            </div>
            
        </div>
    )
}

export function CloseOtherPagesConfirmation({dismissCallback, closeOtherPagesCallback, initiatePageData, closeDirection}:{dismissCallback:()=>void, closeOtherPagesCallback:(initiatePageData:PageData, direction:"left"|"right"|"both")=>void, initiatePageData:PageData, closeDirection: "left"|"right"|"both"}) {
    let message = "";
    if (closeDirection == "left"){
        message = "Do you want to close all pages to the left of:";
    }
    else if (closeDirection == "right"){
        message = "Do you want to close all pages to the right of:";
    }
    else if (closeDirection == "both"){
        message = "Do you want to close all other pages in the panel except for:";
    }
    return (
        <div className="flex flex-col" style={{maxWidth:"34rem"}}>
            <div className='p-6 flex flex-col text-center'>
                <FontAwesomeIcon className="mx-auto text-8xl mb-4 text-foreground-low-1" icon={faTriangleExclamation} />
                <h5 className="mx-auto text-2xl text-foreground-high-1 mb-2">
                    {message}
                </h5>
                <h5 className="mx-auto text-2xl font-semibold text-foreground-high-1 mb-2">{initiatePageData.name}</h5>
                <p className="mx-auto mb-2">(locked Pages will not be closed)</p>
                <p className="mx-auto">Closed pages cannot be recovered</p>
            </div>
            <div className='flex flex-row'>
                <button type='button' className="bg-background-low-1 hover:bg-background-high-2 py-2 font-semibold text-danger flex-1" onClick={()=>{dismissCallback();closeOtherPagesCallback(initiatePageData, closeDirection);}}>Close Other Pages</button>
                <button type='button' className="bg-background-low-1 hover:bg-background-high-2 py-2 font-semibold flex-1" onClick={dismissCallback}>Cancel</button>
            </div>
            
        </div>
    )
}