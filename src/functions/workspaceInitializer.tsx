import { MutableRefObject, RefObject } from "react";
import DefaultPage from "../components/defaultPage";
import { PageDataReference, PanelDivisionReference, PanelFocusReference, PanelPageListReference, PanelPositionReference, WorkspaceConfig, WorkspaceProps, WorkspaceUtility } from "../types/workspaceTypes";

// const topPanelID = getRandomID();
// const newContentID = getRandomID();
const topPanelID = "TOP";
const newPageID = "Page";

export function getEmptyWorkspaceProps() {
    const newPageData = {
        pageID: newPageID,
        name: "New Tab",
        component: DefaultPage,
        parentPanelID: topPanelID,
        persist: false,
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
        activePanelID: topPanelID,
        pageDataReference,
        panelPositionReference: {},
        panelFocusReference,
        panelDivisionReference,
        panelPageListReference,
        draggedData: null,
        topPanelID,
    }

    return initialProps;
}

export function getDefaultConfig() {
    return {
        panelMinimumDimensionRem: { height: 16, width: 16 },
        panelResizeHandleSizeRem: 0.2,
        dragOption: {
            edgeScrollActiveWidthRem: 3,
            edgeScrollMinSpeed: 5,
            edgeScrollMaxSpeed: 25,
            dropSplitActivationPriority: "x",
            dropSplitActivationPercentage: {
                x: 20,
                y: 20
            }
        }
    } as WorkspaceConfig;
}

export function initializeResizeObserver(workspaceUtility: WorkspaceUtility, panelPositionReferenceAccesser: MutableRefObject<PanelPositionReference>, manualResizeFlagRef: MutableRefObject<boolean>, containerRef: RefObject<HTMLDivElement>) {
    const resizeObserver = new ResizeObserver((entries) => {
        const containerRect = containerRef.current!.getBoundingClientRect()
        const newPositionRef: PanelPositionReference = {};
        const alreadyResizedPanelID = [];
        let shouldManualResize = false;
        for (const entry of entries) {
            if (entry.target == containerRef.current!) {
                shouldManualResize = true;
                continue;
            }
            const newRect = entry.target.getBoundingClientRect();
            const panelID = entry.target.parentElement!.id;
            const newPositionMeta: PanelPositionMetadata = {
                panelID: panelID,
                x: newRect.x - containerRect.x,
                y: newRect.y - containerRect.y,
                width: newRect.width,
                height: newRect.height,
            }
            newPositionRef[panelID] = newPositionMeta;
            alreadyResizedPanelID.push(panelID);
        }

        if (shouldManualResize || manualResizeFlagRef.current!) {
            // if the workspace container is resized, or received signal to manual resize, then we need to manually resize all panels not in entries
            // if signal received, clear signal
            if (manualResizeFlagRef.current!) manualResizeFlagRef.current = false;
            const panelPositionReference = panelPositionReferenceAccesser.current!;
            for (const panelID in panelPositionReference) {
                // skip panels that have already been resized
                if (alreadyResizedPanelID.includes(panelID)) continue;
                const newRect = document.getElementById(panelID)!.getBoundingClientRect();
                // skip unmounted panels (positionRef may not be fresh)
                const newPositionMeta: PanelPositionMetadata = {
                    panelID: panelID,
                    x: newRect.x - containerRect.x,
                    y: newRect.y - containerRect.y,
                    width: newRect.width,
                    height: newRect.height,
                }
                newPositionRef[panelID] = newPositionMeta;
            }
        }

        panelUtility!.dispatchPanelPositionReferenceChange({ type: "updateBatch", newPositionMetaRef: newPositionRef });
    });
    return resizeObserver;
}