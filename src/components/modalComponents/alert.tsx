import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DivisionDirection } from '../../types/workspaceTypes';

export function PanelSplitAlert({dismissCallback, divisionDirection}:{dismissCallback:()=>void, divisionDirection:DivisionDirection}) {
    return (
        <div className="flex flex-col">
            <div className='p-6 flex flex-col'>
                <FontAwesomeIcon className="mx-auto text-8xl mb-4 text-foreground-low-1" icon={faTriangleExclamation} />
                <h5 className="mx-auto text-2xl mb-2 font-semibold text-foreground-high-1">Cannot create new panel from split</h5>
                <p className="mx-auto">Workspace {divisionDirection=="horizontal"?"width":"height" } limit reached</p>
            </div>
            <button type='button' className="bg-background-low-1 hover:bg-background-high-2 py-2 font-semibold" onClick={dismissCallback}>OK</button>
        </div>
    )
}

export function CloseDefaultPageAlert({dismissCallback}:{dismissCallback:()=>void,}) {
    return (
        <div className="flex flex-col">
            <div className='p-6 flex flex-col'>
                <FontAwesomeIcon className="mx-auto text-8xl mb-4 text-foreground-low-1" icon={faTriangleExclamation} />
                <h5 className="mx-auto text-2xl mb-2 font-semibold text-foreground-high-1">Cannot close this page</h5>
                <p className="mx-auto">You cannot close the only default page in workspace</p>
            </div>
            <button type='button' className="bg-background-low-1 hover:bg-background-high-2 py-2 font-semibold" onClick={dismissCallback}>OK</button>
        </div>
    )
}
