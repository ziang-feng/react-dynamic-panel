import { useContext, useEffect, useRef, useState } from "react";
import { PanelID, PanelPosition, WorkspaceConfig } from "../types/workspaceTypes";
import { WorkspacePropsContext, WorkspaceActionContext, WorkspaceConfigContext, WorkspaceDragPropsContext, WorkspaceUtilityContext } from "../WorkspaceContainer";
import { useDragDropTarget } from "../hooks/useDragDropTarget";
import { getPanelPageContainerRenderedPosition } from "../functions/utility";

export function PanelPageContainer({ panelID }: { panelID: PanelID }) {
    const selfRef = useRef<HTMLDivElement>(null);
    const workspaceProps = useContext(WorkspacePropsContext);
    const config = useContext(WorkspaceConfigContext);
    const workspaceAction = useContext(WorkspaceActionContext);
    const workspaceDragProps = useContext(WorkspaceDragPropsContext);
    const workspaceUtility = useContext(WorkspaceUtilityContext);

    const [shouldDropShadowShow, setShouldDropShadowShow] = useState(false);
    const [dropShadowState, setDropShadowState] = useState<"full" | "left" | "right" | "top" | "bottom">("full");

    // for accessing drop shadow state in drop
    const dropShadowStateRef = useRef(dropShadowState);

    useEffect(() => {
        const renderedPosition = getPanelPageContainerRenderedPosition(selfRef.current!, workspaceProps!.workspaceContainerRef!);
        const selfPositionReference = {...renderedPosition,panelID:panelID} as PanelPosition;
        workspaceUtility!.setPanelPositionReference({...workspaceProps!.panelPositionReference, [panelID]: selfPositionReference})
        workspaceProps!.resizeObserver!.observe(selfRef.current!);
    }, []);

    // reset drop target states when drag is over
    useEffect(() => {
        if (!workspaceDragProps!.draggedData) setShouldDropShadowShow(false);
    }, [workspaceDragProps!.draggedData]);

    const shouldMaskShow = workspaceDragProps!.draggedData?.type;

    function dragEnterCallback(_event: MouseEvent,) {
        setShouldDropShadowShow(true);
        workspaceDragProps!.setDragCursorStyle("!cursor-move");
    }

    function dragLeaveCallback(_event: MouseEvent,) {
        setShouldDropShadowShow(false);
    }

    function dragOverCallback(event: MouseEvent,) {
        const newShadowState = getDropShadowState(event, selfRef.current!, config!);
        setDropShadowState(newShadowState);
        dropShadowStateRef.current = newShadowState;
    }

    function dropCallback(_event: MouseEvent,) {
        const focusedPageID = workspaceProps!.panelFocusReference[panelID];
        const movedPageID = workspaceDragProps!.draggedData!.pageID;
        const dropShadowState = dropShadowStateRef.current;
        if (dropShadowState == "full") {
            workspaceAction!.movePage(workspaceDragProps!.draggedData!.panelID, panelID, movedPageID, focusedPageID);
        }
        else {
            if (dropShadowState == "left") workspaceAction!.createNewDivision(panelID, "horizontal", "before", movedPageID);
            else if (dropShadowState == "right") workspaceAction!.createNewDivision(panelID, "horizontal", "after", movedPageID);
            else if (dropShadowState == "top") workspaceAction!.createNewDivision(panelID, "vertical", "before", movedPageID);
            else if (dropShadowState == "bottom") workspaceAction!.createNewDivision(panelID, "vertical", "after", movedPageID);
        }
        

    }

    useDragDropTarget(workspaceDragProps!.draggedData, selfRef, dragEnterCallback, dragOverCallback, dragLeaveCallback, dropCallback);

    const dropShadowStyle = {
        width: ["left", "right"].includes(dropShadowState) ? "50%" : "100%",
        height: ["top", "bottom"].includes(dropShadowState) ? "50%" : "100%",
        left: dropShadowState == "right" ? "50%" : "0",
        right: dropShadowState == "left" ? "50%" : "0",
        top: dropShadowState == "bottom" ? "50%" : "0",
        bottom: dropShadowState == "top" ? "50%" : "0",
        opacity: shouldDropShadowShow ? "70%" : "0%"
    }

    return <div className="flex bg-background flex-grow relative" ref={selfRef} id={panelID+"-pageContainer"}>
        <div className={`bg-blue-200 bg-opacity-70 absolute h-full w-full z-30 ${workspaceDragProps?.workspaceMask=="pageContainer"? "flex" : "hidden"}`}/>
        <div className={`bg-transparent absolute h-full w-full z-30 ${shouldMaskShow ? "flex" : "hidden"}`}>
            <div className="bg-background-high-2 transition-all relative" style={dropShadowStyle}>
            </div>
        </div>
    </div>
}

function getDropShadowState(event: MouseEvent, containerElement: HTMLDivElement, config: WorkspaceConfig) {
    const mousePosition = { x: event.clientX, y: event.clientY };
    const containerRect = containerElement.getBoundingClientRect();

    const leftDeltaPct = 100 * (mousePosition.x - containerRect.x) / containerRect.width;
    const topDeltaPct = 100 * (mousePosition.y - containerRect.y) / containerRect.height;

    if (config.dragConfig.dropSplitActivationPriority == "x") {
        if (leftDeltaPct <= config.dragConfig.dropSplitActivationPercentage.x) return "left";
        if ((100 - leftDeltaPct) <= config.dragConfig.dropSplitActivationPercentage.x) return "right";
        if (topDeltaPct <= config.dragConfig.dropSplitActivationPercentage.y) return "top";
        if ((100 - topDeltaPct) <= config.dragConfig.dropSplitActivationPercentage.y) return "bottom";
        return "full";
    }
    else {
        if (topDeltaPct <= config.dragConfig.dropSplitActivationPercentage.y) return "top";
        if ((100 - topDeltaPct) <= config.dragConfig.dropSplitActivationPercentage.y) return "bottom";
        if (leftDeltaPct <= config.dragConfig.dropSplitActivationPercentage.x) return "left";
        if ((100 - leftDeltaPct) <= config.dragConfig.dropSplitActivationPercentage.x) return "right";
        return "full";
    }
}