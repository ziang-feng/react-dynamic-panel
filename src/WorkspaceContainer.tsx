import { createContext, useEffect, useMemo, useRef, useState } from "react";
import { WorkspaceProps, WorkspaceUtility, WorkspaceConfig, PageDataReference, PanelPositionReference, PanelDivisionReference, DraggedData, WorkspaceAction, WorkspaceDragProps, WorkspaceContextMenuState, PageID } from "./types/workspaceTypes";
import { ModalInterface } from "./types/modalTypes";
import { initializeResizeObserver } from "./functions/workspaceInitializer";
import { Panel } from "./components/panel";
import DragIcon from "./components/dragIcon";
import { getWorkspaceActionFromHandler } from "./functions/utility";
import { Modal } from "./components/modal";
import { ContextMenuWrapper } from "./components/contextMenuWrapper";
import { PageComponentIDContext, WorkspaceInterface, getWorkspaceDataAccessor, getWorkspaceExternalAction } from "./functions/workspaceExternalInterface";

export const WorkspaceUtilityContext = createContext<WorkspaceUtility | null>(null);
export const WorkspacePropsContext = createContext<WorkspaceProps | null>(null);
export const WorkspaceActionContext = createContext<WorkspaceAction | null>(null);
export const WorkspaceConfigContext = createContext<WorkspaceConfig | null>(null);
export const WorkspaceDragPropsContext = createContext<WorkspaceDragProps | null>(null);
export const ExternalPageComponentInstanceReferenceContext = createContext<{ [key: PageID]: JSX.Element; } | undefined>(undefined);
export const WorkspaceInterfaceContext = createContext<WorkspaceInterface | null>(null);

export default function WorkspaceContainer({ initialWorkspaceProps, initialWorksapceConfig, externalPageComponentInstanceReference }: { initialWorkspaceProps: WorkspaceProps, initialWorksapceConfig: WorkspaceConfig, externalPageComponentInstanceReference?: { [key: PageID]: JSX.Element; } }) {
    const [pageDataReference, setPageDataReference] = useState<PageDataReference>(initialWorkspaceProps.pageDataReference);
    const [panelPositionReference, setPanelPositionReference] = useState<PanelPositionReference>(initialWorkspaceProps.panelPositionReference);
    const [panelDivisionReference, setPanelDivisionReference] = useState<PanelDivisionReference>(initialWorkspaceProps.panelDivisionReference);
    const [panelFocusReference, setPanelFocusReference] = useState(initialWorkspaceProps.panelFocusReference);
    const [panelPageListReference, setPanelPageListReference] = useState(initialWorkspaceProps.panelPageListReference);
    const workspaceIDRef = useRef(initialWorkspaceProps.workspaceID);
    const topPanelIDRef = useRef(initialWorkspaceProps.topPanelID);
    const workspaceConfigRef = useRef(initialWorksapceConfig);

    // used for tab dragging, drag scrolling
    const [draggedData, setDraggedData] = useState<DraggedData | null>(null);

    const modalInterfaceRef = useRef<ModalInterface>(null);
    const workspaceContainerRef = useRef<HTMLDivElement>(null);

    // for custom context menu
    const [workspaceContextMenuState, setWorkspaceContextMenuState] = useState<WorkspaceContextMenuState>(
        {
            contextData: null,
            relativeMousePosition: { x: 0, y: 0 },
            relativeClearance: { top: 0, right: 0, bottom: 0, left: 0 }
        }
    );

    const workspaceUtility: WorkspaceUtility = {
        setPageDataReference,
        setPanelPositionReference,
        setPanelFocusReference,
        setPanelDivisionReference,
        setPanelPageListReference,
        setWorkspaceContextMenuState,
        modalInterfaceRef: modalInterfaceRef
    };

    // for resizeobserver use only
    // we can only pass in values to the initializer, we pass in a ref object so the most up-to-date positionState can be accessed by .current
    const panelPositionReferenceAccesser = useRef<PanelPositionReference>(panelPositionReference);
    panelPositionReferenceAccesser.current = panelPositionReference;
    const panelDivisionReferenceAccesser = useRef<PanelDivisionReference>(panelDivisionReference);
    panelDivisionReferenceAccesser.current = panelDivisionReference;

    const resizeObserverRef = useRef<ResizeObserver>(initializeResizeObserver(workspaceUtility, panelDivisionReferenceAccesser, workspaceContainerRef));

    const workspaceProps: WorkspaceProps = {
        workspaceID: workspaceIDRef.current,
        pageDataReference,
        panelPositionReference,
        panelFocusReference,
        panelDivisionReference,
        panelPageListReference,
        topPanelID: topPanelIDRef.current,
        workspaceContainerRef,
        resizeObserver: resizeObserverRef.current,
    };



    const workspaceAction = useMemo(() => getWorkspaceActionFromHandler(workspaceProps, workspaceUtility, workspaceConfigRef.current, resizeObserverRef.current), [workspaceProps, workspaceUtility, workspaceConfigRef.current, resizeObserverRef.current]);

    // for drag and drop, and resize handle
    const [workspaceMask, setWorkspaceMask] = useState<"workspace" | "pageContainer" | null>(null);
    const [dragCursorStyle, setDragCursorStyle] = useState("");
    const workspaceDragProps: WorkspaceDragProps = {
        workspaceMask,
        setWorkspaceMask,
        draggedData,
        setDraggedData,
        dragCursorStyle,
        setDragCursorStyle
    }

    // after mount, observe the workspace container for resize
    // also, disable horizontal overscroll to go back and forward in browser
    useEffect(() => {
        workspaceProps!.resizeObserver!.observe(workspaceContainerRef.current!);
        document.body.style.overscrollBehaviorX = "none";
        return () => {
            workspaceProps!.resizeObserver!.disconnect();
            document.body.style.overscrollBehaviorX = "";
        };
    }, []);

    // expose workspace interface for external use
    const workspaceDataAccessor = useMemo(() => getWorkspaceDataAccessor(workspaceProps, workspaceConfigRef.current), [workspaceProps, workspaceConfigRef.current]);
    const workspaceExternalAction = useMemo(() => getWorkspaceExternalAction(workspaceProps, workspaceUtility, workspaceAction), [workspaceProps, workspaceUtility, workspaceAction]);
    const workspaceInterface: WorkspaceInterface = {
        dataAccessor: workspaceDataAccessor,
        externalAction: workspaceExternalAction,
        modalInterfaceRef: modalInterfaceRef
    };

    // render content
    // TODO
    const persistentPageRenderList = [];
    for (let pageID in pageDataReference) {
        const pageData = pageDataReference[pageID];
        if (!pageData.persist) continue; // skip non-persistent pages
        const parentPanelPosition = panelPositionReference[pageData.parentPanelID];

        const pageStyle = parentPanelPosition ? {
            left: parentPanelPosition.x,
            top: parentPanelPosition.y,
            width: parentPanelPosition.width,
            height: parentPanelPosition.height,
            maxWidth: parentPanelPosition.width,
            maxHeight: parentPanelPosition.height,
            overflow: "hidden",
            display: workspaceProps.panelFocusReference[pageData.parentPanelID] == pageID ? "flex" : "none"
        } : {
            maxWidth: "0px",
            maxHeight: "0px",
            overflow: "hidden",
            display: "none"
        }; // when parent panel is not ready, hide the page

        let pageJSX = <div>page not ready</div>; // TODO: change to some message, this is only for externally managed pages that are not ready
        if (pageData.renderData.type == "selfManaged") {
            pageJSX = pageData.renderData.componentInstance;
        }
        else if (pageData.renderData.type == "externallyManaged") {
            if (externalPageComponentInstanceReference && (pageID in externalPageComponentInstanceReference)) pageJSX = externalPageComponentInstanceReference![pageID];
        }
        persistentPageRenderList.push(
            <div className="absolute z-10" style={pageStyle} key={pageID}>
                <PageComponentIDContext.Provider value={pageID}>
                    {pageJSX}
                </PageComponentIDContext.Provider>
            </div>
        );
    }

    return (
        <WorkspaceConfigContext.Provider value={workspaceConfigRef.current}>
            <WorkspaceActionContext.Provider value={workspaceAction}>
                <WorkspacePropsContext.Provider value={workspaceProps}>
                    <WorkspaceUtilityContext.Provider value={workspaceUtility}>
                        <WorkspaceDragPropsContext.Provider value={workspaceDragProps}>
                            <ExternalPageComponentInstanceReferenceContext.Provider value={externalPageComponentInstanceReference}>
                                <WorkspaceInterfaceContext.Provider value={workspaceInterface}>
                                    <div className={`flex h-full w-full bg-white relative overflow-hidden ${draggedData ? "cursor-not-allowed " + workspaceDragProps.dragCursorStyle : ""}`} ref={workspaceContainerRef}>
                                        <div className="overflow-visible absolute h-full w-full">
                                            {persistentPageRenderList}
                                        </div>
                                        <div className="flex h-full w-full bg-white relative">
                                            <Panel panelID={topPanelIDRef.current} dimensionProportion={1} />
                                        </div>
                                        <Modal ref={modalInterfaceRef} />
                                        <div className={`bg-blue-200 bg-opacity-60 absolute h-full w-full z-50 ${workspaceDragProps?.workspaceMask == "workspace" ? "flex" : "hidden"}`} onMouseDown={(e) => { e.preventDefault() }} />
                                        <DragIcon draggedData={draggedData} rootElementRef={workspaceContainerRef} />
                                        <ContextMenuWrapper workspaceContextMenuState={workspaceContextMenuState} />
                                    </div>
                                </WorkspaceInterfaceContext.Provider>
                            </ExternalPageComponentInstanceReferenceContext.Provider>
                        </WorkspaceDragPropsContext.Provider>
                    </WorkspaceUtilityContext.Provider>
                </WorkspacePropsContext.Provider>
            </WorkspaceActionContext.Provider>
        </WorkspaceConfigContext.Provider>
    );
}


