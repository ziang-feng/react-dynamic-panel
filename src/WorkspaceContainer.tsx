import { createContext, useEffect, useMemo, useRef, useState } from "react";
import { WorkspaceProps, WorkspaceUtility, WorkspaceConfig, PageDataReference, PanelPositionReference, PanelDivisionReference, DraggedData, WorkspaceAction, WorkspaceDragProps } from "./types/workspaceTypes";
import { ModalInterface } from "./types/modalTypes";
import { initializeResizeObserver } from "./functions/workspaceInitializer";
import { Panel } from "./components/panel";
import DragIcon from "./components/dragIcon";
import { getWorkspaceActionFromHandler } from "./functions/utility";
import { Modal } from "./components/modal";

export const WorkspaceUtilityContext = createContext<WorkspaceUtility | null>(null);
export const WorkspacePropsContext = createContext<WorkspaceProps | null>(null);
export const WorkspaceActionContext = createContext<WorkspaceAction | null>(null);
export const WorkspaceConfigContext = createContext<WorkspaceConfig | null>(null);
export const WorkspaceDragPropsContext = createContext<WorkspaceDragProps | null>(null);

export default function WorkspaceContainer({ initialWorkspaceProps, config }: { initialWorkspaceProps: WorkspaceProps, config: WorkspaceConfig }) {
    const [activePanelID, setActivePanelID] = useState<string>(initialWorkspaceProps.activePanelID);
    const [pageDataReference, setPageDataReference] = useState<PageDataReference>(initialWorkspaceProps.pageDataReference);
    const [panelPositionReference, setPanelPositionReference] = useState<PanelPositionReference>(initialWorkspaceProps.panelPositionReference);
    const [panelDivisionReference, setPanelDivisionReference] = useState<PanelDivisionReference>(initialWorkspaceProps.panelDivisionReference);
    const [panelFocusReference, setPanelFocusReference] = useState(initialWorkspaceProps.panelFocusReference);
    const [panelPageListReference, setPanelPageListReference] = useState(initialWorkspaceProps.panelPageListReference);

    // used for tab dragging, drag scrolling
    const [draggedData, setDraggedData] = useState<DraggedData | null>(null);

    const modalInterfaceRef = useRef<ModalInterface>(null);
    const workspaceContainerRef = useRef<HTMLDivElement>(null);

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
    panelPositionReferenceAccesser.current = panelPositionReference;
    const panelDivisionReferenceAccesser = useRef<PanelDivisionReference>(panelDivisionReference);
    panelDivisionReferenceAccesser.current = panelDivisionReference;

    const resizeObserverRef = useRef<ResizeObserver>(initializeResizeObserver(workspaceUtility, panelPositionReferenceAccesser, panelDivisionReferenceAccesser, workspaceContainerRef));

    const workspaceProps: WorkspaceProps = {
        workspaceID: initialWorkspaceProps.workspaceID,
        activePanelID,
        pageDataReference,
        panelPositionReference,
        panelFocusReference,
        panelDivisionReference,
        panelPageListReference,
        topPanelID: initialWorkspaceProps.topPanelID,
        workspaceContainerRef,
        resizeObserver: resizeObserverRef.current,
    };

    const workspaceAction = useMemo(() => getWorkspaceActionFromHandler(workspaceProps, workspaceUtility, config, resizeObserverRef.current), [workspaceProps, workspaceUtility, config, resizeObserverRef.current]);

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
    useEffect(() => {
        workspaceProps!.resizeObserver!.observe(workspaceContainerRef.current!);
        return () => {
            workspaceProps!.resizeObserver!.disconnect();
        };
    }, []);

    // render content
    // TODO
    const contentRenderList = [];
    for (let pageID in pageDataReference) {
        const contentMeta = pageDataReference[pageID];
        const parentPanelMeta = panelPositionReference[contentMeta.parentPanelID];

        if (parentPanelMeta) {
            const contentStyle = {
                left: parentPanelMeta.x,
                top: parentPanelMeta.y,
                width: parentPanelMeta.width,
                height: parentPanelMeta.height
            };
            contentRenderList.push(
                <div className="bg-orange-200 absolute z-10" style={contentStyle} key={pageID}></div>
            );
        }
    }

    return (
        <WorkspaceConfigContext.Provider value={config}>
            <WorkspaceActionContext.Provider value={workspaceAction}>
                <WorkspacePropsContext.Provider value={workspaceProps}>
                    <WorkspaceUtilityContext.Provider value={workspaceUtility}>
                        <WorkspaceDragPropsContext.Provider value={workspaceDragProps}>
                            <div className={`flex h-full w-full bg-white relative overflow-hidden ${draggedData ? "cursor-not-allowed " + workspaceDragProps.dragCursorStyle : ""}`} ref={workspaceContainerRef}>
                                <div className="overflow-visible absolute h-full w-full">
                                    {contentRenderList}
                                </div>
                                <div className="flex h-full w-full bg-white relative">
                                    <Panel panelID={initialWorkspaceProps.topPanelID} dimensionProportion={1} />
                                </div>
                                <Modal ref={modalInterfaceRef} />
                                <div className={`bg-blue-200 bg-opacity-60 absolute h-full w-full z-50 ${workspaceDragProps?.workspaceMask == "workspace" ? "flex" : "hidden"}`} />
                                <DragIcon draggedData={draggedData} rootElementRef={workspaceContainerRef} />
                            </div>
                        </WorkspaceDragPropsContext.Provider>
                    </WorkspaceUtilityContext.Provider>
                </WorkspacePropsContext.Provider>
            </WorkspaceActionContext.Provider>
        </WorkspaceConfigContext.Provider>
    );
}


