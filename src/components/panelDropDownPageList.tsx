import { useContext, useEffect, useRef, Dispatch, RefObject } from "react";
import { PageID, PanelID } from "../types/workspaceTypes";
import { WorkspacePropsContext, WorkspaceActionContext, WorkspaceDragPropsContext, WorkspaceConfigContext } from "../WorkspaceContainer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faFile } from "@fortawesome/free-regular-svg-icons";
import { useDrag } from "../hooks/useDrag";

export function PanelDropDownPageList({ panelID, isDropDownListOpen, setIsDropDownListOpen, dropDownButtonRef, scrollToFocusedTab }: { panelID: PanelID; isDropDownListOpen: boolean; setIsDropDownListOpen: Dispatch<boolean>; dropDownButtonRef: RefObject<HTMLButtonElement>; scrollToFocusedTab: () => void; }) {
    const workspaceProps = useContext(WorkspacePropsContext);
    const selfRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const closeList = (event: MouseEvent) => {
            const listElement = selfRef.current!;
            const listButtonElement = dropDownButtonRef.current!;
            if (!listElement.contains(event.target as HTMLElement) && !listButtonElement.contains(event.target as HTMLElement)) setIsDropDownListOpen(false);
        };
        if (isDropDownListOpen) {
            document.addEventListener("mousedown", closeList);
        }
        return () => {
            document.removeEventListener("mousedown", closeList);
        };
    }, [isDropDownListOpen]);

    const pageIDList = workspaceProps!.panelPageListReference[panelID];

    const dropDownListItems = [];
    for (let pageID of pageIDList) {
        dropDownListItems.push(<PanelDropDownPageListItem pageID={pageID} panelID={panelID} scrollToFocusedTab={scrollToFocusedTab} setIsDropDownListOpen={setIsDropDownListOpen} key={pageID}/>);
    }

    const maxHeight = workspaceProps!.panelPositionReference[panelID]?.height;

    return <div className={`flex-col absolute border shadow bg-background border-background-low-2 rounded top-10 right-0 overflow-y-auto overflow-x-hidden z-50 ${isDropDownListOpen ? "flex" : "hidden"}`} ref={selfRef} style={{ maxHeight: `${maxHeight}px` }}>
        {dropDownListItems}
    </div>;
}

function PanelDropDownPageListItem({ panelID, pageID, scrollToFocusedTab, setIsDropDownListOpen }: { panelID: PanelID, pageID: PageID, scrollToFocusedTab: () => void, setIsDropDownListOpen: Dispatch<boolean> }) {
    const workspaceAction = useContext(WorkspaceActionContext);
    const workspaceProps = useContext(WorkspacePropsContext);
    const workspaceConfig = useContext(WorkspaceConfigContext);
    const selfRef = useRef<HTMLDivElement>(null);
    const workspaceDragProps = useContext(WorkspaceDragPropsContext);

    const dragStartCallback = (e: MouseEvent)=>{
        setIsDropDownListOpen(false); // close the dropdown list
        workspaceDragProps!.setWorkspaceMask("workspace");
        const selfContainerRect = selfRef.current!.getBoundingClientRect();
        const startPositionLeftProportion = (e.x - selfContainerRect.x) / selfContainerRect.width;
        const startPositionTopProportion = (e.y - selfContainerRect.y) / selfContainerRect.height;
        workspaceDragProps!.setDraggedData({ type: "pageListItem", panelID: panelID, pageID: pageID, startPosition:{x:e.x, y:e.y}, startPositionRelative:{leftProportion:startPositionLeftProportion, topProportion:startPositionTopProportion} });
    }
    const dragEndCallback = (_e: MouseEvent)=>{workspaceDragProps!.setDraggedData(null);}

    const dragMouseDownHandler = useDrag(selfRef, workspaceConfig!.dragConfig,(_e: MouseEvent)=>{workspaceDragProps!.setWorkspaceMask("pageContainer");},(_e: MouseEvent)=>{workspaceDragProps!.setWorkspaceMask(null);}, dragStartCallback, dragEndCallback);

    const pageData = workspaceProps!.pageDataReference[pageID];
    const icon = pageData.icon ? <FontAwesomeIcon className='' icon={pageData.icon} /> : <FontAwesomeIcon className='' icon={faFile} />;
    const isFocused = pageID == workspaceProps!.panelFocusReference[panelID];

    return <div className={`flex h-10 w-60 bg-background text-foreground hover:text-foreground-high-2 hover:bg-background-high-2 flex-shrink-0`} ref={selfRef} onMouseDown={(e)=>{e.preventDefault();dragMouseDownHandler(e.nativeEvent)}}>
        <button className={`flex ${isFocused ? "w-48" : "w-52"} pl-2`} onClick={() => { setIsDropDownListOpen(false); isFocused ? scrollToFocusedTab() : workspaceAction!.focusPageInPanel(panelID, pageID); }}>
            <span className="my-auto">{icon}</span>
            <span className="my-auto pl-2 text-left whitespace-nowrap overflow-ellipsis overflow-hidden">{pageData.name}</span>
        </button>
        {isFocused ?
            <FontAwesomeIcon className='m-auto w-4 text-foreground-low-1' icon={faEye} />
            : null}
        <button className="h-full flex text-foreground-low-2 hover:bg-background-high-2 hover:text-foreground-high-2 w-8" onClick={() => { workspaceAction!.closePageInPanel(panelID, pageID); }}>
            <FontAwesomeIcon className='m-auto' icon={faXmark} />
        </button>
    </div>
}