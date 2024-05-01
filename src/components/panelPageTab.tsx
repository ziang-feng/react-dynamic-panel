import { PageData, PageID, PanelID, WorkspaceAction, WorkspaceUtility } from "../types/workspaceTypes"
import { WorkspacePropsContext, WorkspaceConfigContext, WorkspaceDragPropsContext, WorkspaceActionContext, WorkspaceUtilityContext } from "../WorkspaceContainer";
import { faFile } from "@fortawesome/free-regular-svg-icons";
import { faLock, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useRef, useState, useEffect } from "react";
import { useDrag } from "../hooks/useDrag";
import { useDragDropTarget } from "../hooks/useDragDropTarget";
import { ClosePageConfirmation } from "./modalComponents/confirmation";
import { canDropTargetAllowDrop, getPositionRelativeClearance } from "../functions/utility";

interface PanelTabProps {
    panelID: PanelID,
    pageID: PageID,
}

export function PanelPageTab({ panelID, pageID }: PanelTabProps) {
    const workspaceProps = useContext(WorkspacePropsContext);
    const workspaceAction = useContext(WorkspaceActionContext);
    const workspaceDragProps = useContext(WorkspaceDragPropsContext);
    const workspaceConfig = useContext(WorkspaceConfigContext);
    const workspaceUtility = useContext(WorkspaceUtilityContext);

    const pageData = workspaceProps!.pageDataReference[pageID];
    const icon = <FontAwesomeIcon className='h-4 w-4 my-auto' icon={pageData.icon?pageData.icon:faFile} />

    const selfRef = useRef<HTMLDivElement>(null);

    const [highlightMask, setHighlightMask] = useState(false);
    useEffect(() => {
        if (!workspaceDragProps!.draggedData) setHighlightMask(false);
    }, [workspaceDragProps!.draggedData]);

    // for dragging the tab
    const dragStartCallback = (e: MouseEvent) => {
        workspaceDragProps!.setWorkspaceMask("workspace");
        workspaceDragProps!.setDraggedData({ type: "tab", panelID: panelID, pageID: pageID, startPosition: { x: e.x, y: e.y } });
    }
    const dragEndCallback = (_e: MouseEvent) => { workspaceDragProps!.setDraggedData(null); }

    // for drop target
    const dragEnterCallback = (_e: MouseEvent) => {
        setHighlightMask(true);
        if (canDropTargetAllowDrop(workspaceProps!, workspaceDragProps!.draggedData!, pageID)) workspaceDragProps!.setDragCursorStyle("!cursor-move");
        else workspaceDragProps!.setDragCursorStyle("");
    }
    const dragLeaveCallback = (_e: MouseEvent) => {
        setHighlightMask(false);
    }
    const dragOverCallback = (_e: MouseEvent) => {
        //console.log(`drag over ${pageID}`);
    }
    const dropCallback = (_e: MouseEvent) => {
        const orgPanelID = workspaceDragProps!.draggedData!.panelID;
        const draggedTabPageID = workspaceDragProps!.draggedData!.pageID;
        setHighlightMask(false);
        if (draggedTabPageID == pageID) return;
        workspaceAction!.movePage(orgPanelID, panelID, draggedTabPageID, pageID);
    }

    const dragMouseDownHandler = useDrag(selfRef, workspaceConfig!.dragConfig, (_e: MouseEvent) => { workspaceDragProps!.setWorkspaceMask("pageContainer"); }, (_e: MouseEvent) => { workspaceDragProps!.setWorkspaceMask(null); }, dragStartCallback, dragEndCallback);

    useDragDropTarget(workspaceDragProps!.draggedData, selfRef, dragEnterCallback, dragOverCallback, dragLeaveCallback, dropCallback);

    const closePageHandler = getClosePageSingleActionHandler(workspaceAction!, workspaceUtility!, pageData);

    const onContextMenuHandler = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
        const workspaceContainerRect = workspaceProps!.workspaceContainerRef!.current!.getBoundingClientRect();
        const clearance = getPositionRelativeClearance(e.nativeEvent, workspaceContainerRect);
        workspaceUtility!.setWorkspaceContextMenuState({ contextData: { type: "panelPageTab", pageID: pageID }, relativeMousePosition: { x: e.clientX - workspaceContainerRect.x, y: e.clientY - workspaceContainerRect.y }, relativeClearance: clearance });
    }

    return (
        <div className={`min-w-44 h-full flex flex-row flex-shrink-0 w-min relative ${workspaceProps!.panelFocusReference[panelID] == pageID ? "bg-background text-foreground-high-1" : "bg-background-low-1 text-foreground-low-1"} ${workspaceDragProps!.draggedData ? "" : "hover:bg-background-high-1"}`} ref={selfRef} id={`${pageID}-pageTab`} onMouseDown={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => dragMouseDownHandler(e.nativeEvent)} onContextMenu={onContextMenuHandler}>
            <button className="flex px-2 flex-grow" onClick={() => workspaceAction!.focusPageInPanel(panelID, pageID)}>
                {icon}
                <span className="my-auto pl-2 whitespace-nowrap mr-auto">{pageData.name}</span>
            </button>
            <button className={`px-2 text-foreground-low-2 border-r border-foreground-low-2 ${pageData.locked ? "" : "hover:bg-background-high-2 hover:text-foreground-high-2"}`} onClick={pageData.locked ? () => workspaceAction!.focusPageInPanel(panelID, pageID) : closePageHandler}>
                {pageData.locked ? <FontAwesomeIcon className='w-4 h-4' icon={faLock} /> : <FontAwesomeIcon className='w-4 h-4' icon={faXmark} />}
            </button>
            <div className={`absolute h-full w-full bg-background-high-2 flex text-foreground-high-2 font-bold ${workspaceDragProps!.draggedData?.type == "tab" ? "" : "hidden"} ${highlightMask ? "opacity-80" : "opacity-0"}`} />
        </div>
    )
}

export function getClosePageSingleActionHandler(workspaceAction: WorkspaceAction, workspaceUtility: WorkspaceUtility, pageData: PageData) {
    return () => {
        if (!pageData.confirmClose) {
            workspaceAction!.closePageInPanel(pageData.parentPanelID, pageData.pageID);
        }
        else {
            workspaceUtility!.modalInterfaceRef.current!.showModalWithData!({ innerComponent: <ClosePageConfirmation dismissCallback={workspaceUtility!.modalInterfaceRef.current!.hideModal!} closePageCallback={(pageData) => { workspaceAction!.closePageInPanel(pageData.parentPanelID, pageData.pageID); }} closedPageData={pageData} /> })
        }

    }
}