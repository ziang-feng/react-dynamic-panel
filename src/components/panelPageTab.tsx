import { PageID, PanelID } from "../types/workspaceTypes"
import { WorkspacePropsContext, WorkspaceConfigContext, WorkspaceDragPropsContext, WorkspaceActionContext } from "../WorkspaceContainer";
import { faFile } from "@fortawesome/free-regular-svg-icons";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useRef, useState, useEffect } from "react";
import { useDrag } from "../hooks/useDrag";
import { useDragDropTarget } from "../hooks/useDragDropTarget";

interface PanelTabProps {
    panelID: PanelID,
    pageID: PageID,
}

export function PanelPageTab({ panelID, pageID }: PanelTabProps) {
    const workspaceProps = useContext(WorkspacePropsContext);
    const workspaceAction = useContext(WorkspaceActionContext);
    const workspaceDragProps = useContext(WorkspaceDragPropsContext);
    const workspaceConfig = useContext(WorkspaceConfigContext);

    const pageData = workspaceProps!.pageDataReference[pageID];
    const icon = pageData.icon ? <FontAwesomeIcon className='' icon={pageData.icon} /> : <FontAwesomeIcon className='' icon={faFile} />;

    const selfRef = useRef<HTMLDivElement>(null);

    const [highlightMask, setHighlightMask] = useState(false);
    useEffect(() => {
        if (!workspaceDragProps!.draggedData) setHighlightMask(false);
    }, [workspaceDragProps!.draggedData]);

    // for dragging the tab
    const dragStartCallback = (e: MouseEvent)=>{
        workspaceDragProps!.setWorkspaceMask("workspace");
        workspaceDragProps!.setDraggedData({ type: "tab", panelID: panelID, pageID: pageID, startPosition:{x:e.x, y:e.y} });
    }
    const dragEndCallback = (_e: MouseEvent)=>{workspaceDragProps!.setDraggedData(null);}

    // for drop target
    const dragEnterCallback = (_e: MouseEvent)=>{
        setHighlightMask(true);
        if (workspaceDragProps!.draggedData!.pageID==pageID){
            workspaceDragProps!.setDragCursorStyle("");
            return;
        }
        workspaceDragProps!.setDragCursorStyle("!cursor-move");
    }
    const dragLeaveCallback = (_e: MouseEvent)=>{
        setHighlightMask(false);
    }
    const dragOverCallback = (_e: MouseEvent)=>{
        //console.log(`drag over ${pageID}`);
    }
    const dropCallback = (_e: MouseEvent)=>{
        const orgPanelID = workspaceDragProps!.draggedData!.panelID;
        const draggedTabPageID = workspaceDragProps!.draggedData!.pageID;
        setHighlightMask(false);
        if (draggedTabPageID==pageID) return;
        workspaceAction!.movePage(orgPanelID, panelID, draggedTabPageID, pageID);
    }

    const dragMouseDownHandler = useDrag(selfRef, workspaceConfig!.dragConfig,(_e: MouseEvent)=>{workspaceDragProps!.setWorkspaceMask("pageContainer");},(_e: MouseEvent)=>{workspaceDragProps!.setWorkspaceMask(null);}, dragStartCallback, dragEndCallback);

    useDragDropTarget(workspaceDragProps!.draggedData, selfRef, dragEnterCallback, dragOverCallback, dragLeaveCallback, dropCallback);



    return (
        <div className={`min-w-44 h-full flex flex-row w-min relative ${workspaceProps!.panelFocusReference[panelID] == pageID ? "bg-background text-foreground-high-1" : "bg-background-low-1 text-foreground-low-1"} ${workspaceDragProps!.draggedData ? "" : "hover:bg-background-high-1"}`} ref={selfRef} id={`${pageID}-tab`} onMouseDown={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => dragMouseDownHandler(e.nativeEvent)}>
            <button className="flex px-2 flex-grow" onClick={() => workspaceAction!.focusPageInPanel(panelID, pageID)}>
                <span className="my-auto">{icon}</span>
                <span className="my-auto pl-2 whitespace-nowrap mr-auto">{pageData.name}</span>
            </button>
            <button className={`px-2 text-foreground-low-2 border-r border-foreground-low-2 ${workspaceDragProps!.draggedData ? "" : "hover:bg-background-high-2 hover:text-foreground-high-2"}`} onClick={() => workspaceAction!.closePageInPanel(panelID, pageID)}>
                <FontAwesomeIcon className='' icon={faXmark} />
            </button>
            <div className={`absolute h-full w-full bg-background-high-2 flex text-foreground-high-2 font-bold ${workspaceDragProps!.draggedData?.type == "tab" ? "" : "hidden"} ${highlightMask ? "opacity-80" : "opacity-0"}`}/>
        </div>
    )
}