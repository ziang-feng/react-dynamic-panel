import { RefObject } from "react";
import DefaultPage from "../components/defaultPage";
import { ContextMenuItem, PageDataReference, PageRenderData, PanelDivisionReference, PanelFocusReference, PanelPageListReference, PanelPositionReference, WorkspaceConfig, WorkspaceProps, WorkspaceUtility } from "../types/workspaceTypes";

// const topPanelID = getSafeRandomID();
// const newContentID = getSafeRandomID();


export function getEmptyWorkspaceProps() {
    const topPanelID = "TOP";
    const workspaceID = "WS1";
    const newPageID = "Page";
    const newPageData = {
        pageID: newPageID,
        name: "New Page",
        parentPanelID: topPanelID,
        persist: false,
        creationTimestamp: Date.now(),
        lastFocusedTimestamp: Date.now(),
        renderData:{
            type: "selfManaged",
            componentInstance: <DefaultPage/>
        } as PageRenderData
    };
    // set pageData ref
    const pageDataReference: PageDataReference = {
        [newPageID]: newPageData
    }

    // set panelDivision ref
    const panelDivisionReference: PanelDivisionReference = {
        [topPanelID]: {
            panelID: topPanelID,
            subPanelIDList: [],
            divisionDirection: null,
            divisionProportionList: [],
        }
    }

    // panel content order
    const panelPageListReference: PanelPageListReference = {
        [topPanelID]: [newPageID]
    }

    // focus
    const panelFocusReference: PanelFocusReference = {
        [topPanelID]: newPageID
    }

    // inital prop
    const initialProps: WorkspaceProps = {
        workspaceID: workspaceID,
        pageDataReference,
        panelPositionReference: {},
        panelFocusReference,
        panelDivisionReference,
        panelPageListReference,
        topPanelID,
    }

    return initialProps;
}

export function getDefaultConfig() {
    return {
        panelMinimumDimensionRem: { height: 16, width: 16 },
        panelResizeHandleSizeRem: 0.2,
        contextMenuConfig: {
            panelPageTab: {
                itemHeightRem: 2,
                itemWidthRem: 15,
            },
        },
        dragConfig: {
            edgeScrollActiveWidthRem: 3,
            edgeScrollMinSpeed: 5,
            edgeScrollMaxSpeed: 25,
            dropSplitActivationPriority: "x",
            dropSplitActivationPercentage: {
                x: 20,
                y: 20
            },
            dragActivationThresholdRem: 0.5
        }
    } as WorkspaceConfig;
}

export function initializeResizeObserver(workspaceUtility: WorkspaceUtility, panelDivisionReferenceAccesser:RefObject<PanelDivisionReference>, workspaceRootContainerRef: RefObject<HTMLDivElement>) {
    const resizeObserver = new ResizeObserver((_entries) => {
        const rootContainerRect = workspaceRootContainerRef.current!.getBoundingClientRect()
        const panelDivisionReference = panelDivisionReferenceAccesser.current!;
        const newPanelPositionReference: PanelPositionReference = {};
        // reset context menu when panel/workspace are resized to prevent context menu from being displayed in the wrong position
        workspaceUtility.setWorkspaceContextMenuState({ contextData: null, relativeMousePosition: { x: 0, y: 0 }, relativeClearance: { top: 0, right: 0, bottom: 0, left: 0 } });

        for (const panelID in panelDivisionReference){
            // skip panels that are not end panels
            if (panelDivisionReference[panelID].subPanelIDList.length != 0) continue;
            const panelPageContainerClientRect = document.getElementById(panelID+"-pageContainer")!.getBoundingClientRect();
            const panelPageContainerRelativePosition = {
                panelID: panelID,
                x: panelPageContainerClientRect.x - rootContainerRect.x,
                y: panelPageContainerClientRect.y - rootContainerRect.y,
                width: panelPageContainerClientRect.width,
                height: panelPageContainerClientRect.height,
            }
            newPanelPositionReference[panelID] = panelPageContainerRelativePosition;
        }
        workspaceUtility!.setPanelPositionReference(newPanelPositionReference);
    });
    return resizeObserver;
}