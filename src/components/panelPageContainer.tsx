import { useContext, useEffect, useRef, useState } from "react";
import { PanelID, PanelPosition, WorkspaceConfig } from "../types/workspaceTypes";
import { WorkspacePropsContext, WorkspaceActionContext, WorkspaceConfigContext, WorkspaceDragPropsContext, WorkspaceUtilityContext, ExternalPageComponentInstanceReferenceContext } from "../WorkspaceContainer";
import { useDragDropTarget } from "../hooks/useDragDropTarget";
import { getPanelPageContainerRenderedPosition, getPanelPageListAfterMove, isPageListOrderValid } from "../functions/utility";
import { PageComponentIDContext } from "../functions/workspaceExternalInterface";

export function PanelPageContainer({ panelID }: { panelID: PanelID }) {
    const selfRef = useRef<HTMLDivElement>(null);
    const workspaceProps = useContext(WorkspacePropsContext);
    const config = useContext(WorkspaceConfigContext);
    const workspaceAction = useContext(WorkspaceActionContext);
    const workspaceDragProps = useContext(WorkspaceDragPropsContext);
    const workspaceUtility = useContext(WorkspaceUtilityContext);
    const externalPageComponentInstanceReference = useContext(ExternalPageComponentInstanceReferenceContext);

    const [shouldDropShadowShow, setShouldDropShadowShow] = useState(false);
    const [dropShadowState, setDropShadowState] = useState<"full" | "left" | "right" | "top" | "bottom">("full");

    // for accessing drop shadow state in drop
    const dropShadowStateRef = useRef(dropShadowState);

    useEffect(() => {
        const renderedPosition = getPanelPageContainerRenderedPosition(selfRef.current!, workspaceProps!.workspaceContainerRef!);
        const selfPositionReference = { ...renderedPosition, panelID: panelID } as PanelPosition;
        workspaceUtility!.setPanelPositionReference({ ...workspaceProps!.panelPositionReference, [panelID]: selfPositionReference })
        workspaceProps!.resizeObserver!.observe(selfRef.current!);
    }, []);

    // reset drop target states when drag is over
    useEffect(() => {
        if (!workspaceDragProps!.draggedData) setShouldDropShadowShow(false);
    }, [workspaceDragProps!.draggedData]);

    const shouldMaskShow = workspaceDragProps!.draggedData?.type;

    const validDropActionRef = useRef({ move: true, split: true });

    function dragEnterCallback(_event: MouseEvent,) {
        setShouldDropShadowShow(true);
        // set validDropActionRef based on the dragged page tab and focused page tab
        const focusedPageID = workspaceProps!.panelFocusReference[panelID];
        const movedPageID = workspaceDragProps!.draggedData!.pageID;
        // for split, only allow when movedPage is unlocked
        if (workspaceProps!.pageDataReference[movedPageID].locked) validDropActionRef.current.split = false;
        else validDropActionRef.current.split = true;

        // for move
        // if moved page is locked and from a different panel, disallow move
        if (workspaceProps!.pageDataReference[movedPageID].locked && workspaceDragProps!.draggedData!.panelID != panelID) {
            validDropActionRef.current.move = false;
        }
        // for other moves, check if the order is valid
        else {
            const pageListAfterMove = getPanelPageListAfterMove(workspaceProps!.panelPageListReference[panelID], movedPageID, focusedPageID);
            const isOrderValid = isPageListOrderValid(pageListAfterMove, workspaceProps!.pageDataReference);
            if (!isOrderValid) validDropActionRef.current.move = false;
            else validDropActionRef.current.move = true;
        }

    }

    function dragLeaveCallback(_event: MouseEvent,) {
        setShouldDropShadowShow(false);
    }

    function dragOverCallback(event: MouseEvent,) {
        const newShadowState = getDropShadowState(event, selfRef.current!, config!);
        setDropShadowState(newShadowState);
        dropShadowStateRef.current = newShadowState;

        // show drag cursor style based on drop location and valid drop action
        if (newShadowState == "full") {
            // drop move
            if (validDropActionRef.current.move) workspaceDragProps!.setDragCursorStyle("!cursor-move");
            else workspaceDragProps!.setDragCursorStyle("");
        }
        else {
            // drop split
            if (validDropActionRef.current.split) workspaceDragProps!.setDragCursorStyle("!cursor-move");
            else workspaceDragProps!.setDragCursorStyle("");
        }
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

    // render non-persistent pages
    let nonPersistentPageComponent = null;
    const focusedPageID = workspaceProps!.panelFocusReference[panelID];
    const focusedPageData = workspaceProps!.pageDataReference[focusedPageID];
    if (!focusedPageData.persist) {
        if (focusedPageData.renderData.type == "selfManaged") nonPersistentPageComponent = focusedPageData.renderData.componentInstance;
        else if (focusedPageData.renderData.type == "externallyManaged") {
            if (externalPageComponentInstanceReference && (focusedPageID in externalPageComponentInstanceReference)) nonPersistentPageComponent = externalPageComponentInstanceReference[focusedPageID];
            else nonPersistentPageComponent = <div>Page not ready</div>; // TODO: change to some message, this is only for externally managed pages that are not ready 
        }
    }



    return <div className="flex bg-background flex-grow relative w-full overflow-hidden" ref={selfRef} id={panelID + "-pageContainer"} style={{ maxHeight: "calc(100% - 2.5rem)", height: "calc(100% - 2.5rem)" }}>
        <div className="w-full h-full overflow-hidden" key={focusedPageID}>
            <PageComponentIDContext.Provider value={focusedPageID}>
                {nonPersistentPageComponent}
            </PageComponentIDContext.Provider>
        </div>
        <div className={`bg-blue-200 bg-opacity-70 absolute h-full w-full z-30 ${workspaceDragProps?.workspaceMask == "pageContainer" ? "flex" : "hidden"}`} />
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