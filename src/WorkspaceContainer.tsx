import { useEffect, useReducer, useRef, useState } from "react";
import { WorkspaceUtilityContext, WorkspacePropsContext, WorkspaceHandlerContext, WorkspaceConfigContext } from "./contexts/workspaceContext";

import { PanelID, WorkspaceProps, WorkspaceUtility, WorkspaceConfig, PageDataReference, PanelPositionReference, PanelDivisionReference, DraggedData, WorkspaceID } from "./types/workspaceTypes";
import { useDragMoveRef } from "./hooks/useDragMoveRef";
import { ModalInterface } from "./types/modalTypes";

export default function WorkspaceContainer({ initialWorkspaceProps, workspaceID, topPanelID, config }: { initialWorkspaceProps: WorkspaceProps, workspaceID: WorkspaceID, topPanelID: PanelID, config: WorkspaceConfig }) {
    const [activePanelID, setActivePanelID] = useState<string>(initialWorkspaceProps.activePanelID);
    const [pageDataReference, setPageDataReference] = useState<PageDataReference>(initialWorkspaceProps.pageDataReference);
    const [panelPositionReference, setPanelPositionReference] = useState<PanelPositionReference>(initialWorkspaceProps.panelPositionReference);
    const [panelDivisionReference, setPanelDivisionReference] = useState<PanelDivisionReference>(initialWorkspaceProps.panelDivisionReference);
    const [panelFocusReference, setPanelFocusReference] = useState(initialWorkspaceProps.panelFocusReference);
    const [panelPageListReference, setPanelPageListReference] = useState(initialWorkspaceProps.panelPageListReference);

    // used for tab dragging, drag scrolling
    const [draggedData, setDraggedData] = useState<DraggedData | null>(null);
    const dragPositionRef = useDragMoveRef(draggedData);

    const modalInterfaceRef = useRef<ModalInterface>(null);
    const selfRef = useRef<HTMLDivElement>(null);

    const workspaceUtility: WorkspaceUtility = {
        setActivePanelID,
        setPageDataReference,
        setPanelPositionReference,
        setPanelFocusReference,
        setPanelDivisionReference,
        setPanelPageListReference,
        setDraggedData,
        showModalWithData: modalInterfaceRef.current?.showModalWithData,
    };

    // for resizeobserver use only
    // we can only pass in values to the initializer, we pass in a ref object so the most up-to-date positionState can be accessed by .current
    const panelPositionReferenceAccesser = useRef<PanelPositionReference>(panelPositionReference);
    // update value with every position ref change
    useEffect(()=>{
        panelPositionReferenceAccesser.current = panelPositionReference;
    },[panelPositionReference]);

    // used to communicate with the resizeObserver to recalculate all panel positions when new panel is first created
    const manualResizeFlagRef = useRef<boolean>(false);
    const resizeObserverRef = useRef<ResizeObserver>(initiateResizeObserver(workspaceUtility, panelPositionReferenceAccesser, manualResizeFlagRef, selfRef));

    const workspaceProps: WorkspaceProps = {
        activePanelID,
        pageDataReference,
        panelPositionReference,
        panelFocusReference,
        panelDivisionReference,
        panelPageListReference,
        draggedData,
        dragPositionRef,
        topPanelID,
        resizeObserver: resizeObserverRef.current,
        manualResizeFlagRef,
    };

    const workspaceFunction: WorkspaceFunction = {
        createNewTabInPanel,
        createNewSplit,
        closeTabInPanel,
        focusTabInPanel,
        moveTabToPanel,
        moveTabInPanel
    }

    function createNewTabInPanel(panelID: PanelID, newContentMeta?: PanelContentMetadata, afterContentID?: ContentID) { createNewTabInPanelReducer(panelID, panelUtility, panelGlobalProps, newContentMeta, afterContentID) };

    function createNewSplit(initiatePanelID: PanelID, splitDirection: SplitDirection, newPanelPosition: "after" | "before", movedContentID?: ContentID) { createNewSplitReducer(initiatePanelID, splitDirection, newPanelPosition, panelUtility, panelGlobalProps, config, movedContentID) };

    function closeTabInPanel(panelID: PanelID, tabContentID: ContentID) { closeTabInPanelReducer(panelID, tabContentID, panelUtility, panelGlobalProps) };

    function focusTabInPanel(panelID: PanelID, tabContentID: ContentID) { focusTabInPanelReducer(panelID, tabContentID, panelUtility, panelGlobalProps) };

    function moveTabToPanel(orgPanelID: PanelID, targetPanelID: PanelID, tabContentID: ContentID, targetPositionContentID: ContentID | null, relativePosition: "before" | "after") { moveTabToPanelReducer(orgPanelID, targetPanelID, tabContentID, targetPositionContentID, relativePosition, panelUtility, panelGlobalProps) };

    function moveTabInPanel(panelID: PanelID, tabContentID: ContentID, targetPositionContentID: ContentID | null, relativePosition: "before" | "after") { moveTabInPanelReducer(panelID, tabContentID, targetPositionContentID, relativePosition, panelUtility, panelGlobalProps) };

    // recalcualte panel position after resize
    useEffect(() => {
        let refStore = selfRef.current!;
        panelGlobalProps!.resizeObserver!.observe(refStore);
        return () => {
            if (refStore) panelGlobalProps!.resizeObserver!.unobserve(refStore);
        };
    }, []);

    // render content
    // TODO
    const contentRenderList = [];
    for (let contentID in contentReference) {
        const contentMeta = contentReference[contentID];
        const parentPanelMeta = panelPositionReference[contentMeta.parentPanelID];

        if (parentPanelMeta) {
            const contentStyle = {
                left: parentPanelMeta.x,
                top: parentPanelMeta.y,
                width: parentPanelMeta.width,
                height: parentPanelMeta.height
            };
            contentRenderList.push(
                <div className="bg-orange-200 absolute z-10" style={contentStyle} key={contentID}></div>
            );
        }
    }

    return (
        <WorkspaceConfigContext.Provider value={config}>
            <WorkspaceFunctionContext.Provider value={workspaceFunction}>
                <PanelGlobalPropsContext.Provider value={panelGlobalProps}>
                    <PanelUtilityContext.Provider value={panelUtility}>
                        <div className="flex h-full w-full bg-white relative overflow-auto" ref={selfRef}>
                            <div className="overflow-visible absolute h-full w-full">
                                {contentRenderList}
                            </div>
                            <div className="flex h-full w-full bg-white relative">
                                <Panel panelID={topPanelID} />
                            </div>
                            <Modal ref={modalInterfaceRef} />
                        </div>
                    </PanelUtilityContext.Provider>
                </PanelGlobalPropsContext.Provider>
            </WorkspaceFunctionContext.Provider>
        </WorkspaceConfigContext.Provider>
    );
}
