import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DivisionDirection, PageData } from '../../types/workspaceTypes';

export function PanelSplitAlert({ dismissCallback, divisionDirection }: { dismissCallback: () => void, divisionDirection: DivisionDirection }) {
    return (
        <div className="flex flex-col text-center" style={{ maxWidth: "34rem" }}>
            <div className='p-6 flex flex-col'>
                <FontAwesomeIcon className="mx-auto text-8xl mb-4 text-foreground-low-1" icon={faTriangleExclamation} />
                <h5 className="mx-auto text-2xl mb-2 font-semibold text-foreground-high-1">Cannot create new panel from split</h5>
                <p className="mx-auto">Workspace {divisionDirection == "horizontal" ? "width" : "height"} limit reached</p>
            </div>
            <button type='button' className="bg-background-low-1 hover:bg-background-high-2 py-2 font-semibold" onClick={dismissCallback}>OK</button>
        </div>
    )
}

export function CloseDefaultPageAlert({ dismissCallback }: { dismissCallback: () => void, }) {
    return (
        <div className="flex flex-col text-center" style={{ maxWidth: "34rem" }}>
            <div className='p-6 flex flex-col'>
                <FontAwesomeIcon className="mx-auto text-8xl mb-4 text-foreground-low-1" icon={faTriangleExclamation} />
                <h5 className="mx-auto text-2xl mb-2 font-semibold text-foreground-high-1">Cannot close this page</h5>
                <p className="mx-auto">You cannot close the only default page in workspace</p>
            </div>
            <button type='button' className="bg-background-low-1 hover:bg-background-high-2 py-2 font-semibold" onClick={dismissCallback}>OK</button>
        </div>
    )
}

export function CloseLockedPageAlert({ dismissCallback, closedPageData }: { dismissCallback: () => void, closedPageData: PageData }) {
    return (
        <div className="flex flex-col text-center" style={{ maxWidth: "34rem" }}>
            <div className='p-6 flex flex-col'>
                <FontAwesomeIcon className="mx-auto text-8xl mb-4 text-foreground-low-1" icon={faTriangleExclamation} />
                <h5 className="mx-auto text-2xl text-foreground-high-1 mb-2">
                    Cannot close the locked page:
                </h5>
                <h5 className="mx-auto text-2xl font-semibold text-foreground-high-1 mb-2">{closedPageData.name}</h5>
                <p className="mx-auto">You need to unlock the page before closing it</p>
            </div>
            <button type='button' className="bg-background-low-1 hover:bg-background-high-2 py-2 font-semibold" onClick={dismissCallback}>OK</button>
        </div>
    )
}

export function MoveLockedPageOutPanelAlert({ dismissCallback, movedPageData }: { dismissCallback: () => void, movedPageData: PageData }) {
    return (
        <div className="flex flex-col text-center" style={{ maxWidth: "34rem" }}>
            <div className='p-6 flex flex-col'>
                <FontAwesomeIcon className="mx-auto text-8xl mb-4 text-foreground-low-1" icon={faTriangleExclamation} />
                <h5 className="mx-auto text-2xl text-foreground-high-1 mb-2">
                    Cannot move the locked page:
                </h5>
                <h5 className="mx-auto text-2xl font-semibold text-foreground-high-1 mb-2">{movedPageData.name}</h5>
                <h5 className="mx-auto text-2xl text-foreground-high-1 mb-2">
                    to a different panel
                </h5>
                <p className="mx-auto">You need to unlock the page before moving it to a different panel</p>
            </div>
            <button type='button' className="bg-background-low-1 hover:bg-background-high-2 py-2 font-semibold" onClick={dismissCallback}>OK</button>
        </div>
    )
}

export function MovePageAlert({ dismissCallback, movedPageData }: { dismissCallback: () => void, movedPageData: PageData }) {
    const message = movedPageData.locked ?
        "Locked Pages cannot be moved after unlocked Pages" :
        "Unlocked Pages cannot be moved before locked Pages";
    return (
        <div className="flex flex-col text-center" style={{ maxWidth: "34rem" }}>
            <div className='p-6 flex flex-col'>
                <FontAwesomeIcon className="mx-auto text-8xl mb-4 text-foreground-low-1" icon={faTriangleExclamation} />
                <h5 className="mx-auto text-2xl text-foreground-high-1 mb-2">
                    Cannot move the {movedPageData.locked ? "locked" : "unlocked"} page:
                </h5>
                <h5 className="mx-auto text-2xl font-semibold text-foreground-high-1 mb-2">{movedPageData.name}</h5>
                <h5 className="mx-auto text-2xl text-foreground-high-1 mb-2">
                    to the target position
                </h5>
                <p className="mx-auto">{message}</p>
            </div>
            <button type='button' className="bg-background-low-1 hover:bg-background-high-2 py-2 font-semibold" onClick={dismissCallback}>OK</button>
        </div>
    )
}

export function MoveLockedPageNewPanelAlert({ dismissCallback, movedPageData }: { dismissCallback: () => void, movedPageData: PageData }) {
    return (
        <div className="flex flex-col text-center" style={{ maxWidth: "34rem" }}>
            <div className='p-6 flex flex-col'>
                <FontAwesomeIcon className="mx-auto text-8xl mb-4 text-foreground-low-1" icon={faTriangleExclamation} />
                <h5 className="mx-auto text-2xl text-foreground-high-1 mb-2">
                    Cannot create a new panel by moving the locked page:
                </h5>
                <h5 className="mx-auto text-2xl font-semibold text-foreground-high-1 mb-2">{movedPageData.name}</h5>
                <p className="mx-auto">You need to unlock the page first</p>
            </div>
            <button type='button' className="bg-background-low-1 hover:bg-background-high-2 py-2 font-semibold" onClick={dismissCallback}>OK</button>
        </div>
    )
}