import { RefObject } from "react";
import { ContextData, DivisionDirection, DraggedData, ElementRect, PageData, PageDataReference, PageID, PageRenderData, PanelDivision, PanelDivisionReference, PanelID, PanelPageListReference, WorkspaceAction, WorkspaceConfig, WorkspaceID, WorkspaceProps, WorkspaceUtility } from "../types/workspaceTypes";
import WorkspaceActionHandler from "./workspaceActionHandler";
import { PANEL_PAGE_TAB_CONTEXT_MENU_ITEMS } from "../components/contextMenus/panelPageTabContextMenu";
import DefaultPage from "../components/defaultPage";
import { NewPageData } from "./workspaceExternalInterface";

export function getRemPxSize(document: Document) {
    return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function getRandomID(workspaceID: WorkspaceID, type: "panel" | "page") {
    return workspaceID + "-" + type + "-" + Math.random().toString(36).substring(2, 10);
}

export function getSafeRandomID(workspaceID: WorkspaceID, type: "panel" | "page", workspaceProps: WorkspaceProps) {
    let randomID = getRandomID(workspaceID, type);
    if (type == "panel") {
        while (randomID in workspaceProps.panelDivisionReference) {
            randomID = getRandomID(workspaceID, type);
        }
    }
    else if (type == "page") {
        while (randomID in workspaceProps.pageDataReference) {
            randomID = getRandomID(workspaceID, type);
        }
    }
    return randomID;
}

export function DFSGetFirstEndPanel(startPanelDivision: PanelDivision, panelDivisionReference: PanelDivisionReference, avoidPanelID?: PanelID): PanelID | null {
    // Get the first Panel under the start panel that is a page-panel (has no subpanels) using DFS

    // Check if the current panel has no sub-panels
    if (startPanelDivision.subPanelIDList.length === 0) {
        return startPanelDivision.panelID;
    }

    // Recursively explore the sub-panels
    for (const subPanelID of startPanelDivision.subPanelIDList) {
        if (subPanelID == avoidPanelID) continue;
        const subPanel = panelDivisionReference[subPanelID];
        let result: PanelID | null = DFSGetFirstEndPanel(subPanel, panelDivisionReference);
        if (result !== null) {
            return result;
        }
    }

    // No panel with subPanelIDList length equal to zero found
    return null;
}

export function getMaxSubPanelCount(panelID: PanelID, direction: DivisionDirection, panelDivisionReference: PanelDivisionReference): number {
    // get the maximum number of individual panels in a specified direction under a panel

    const currentPanelDivisionState = panelDivisionReference[panelID];
    // end node, always return 1
    if (currentPanelDivisionState.subPanelIDList.length === 0) {
        return 1;
    }

    let childrenSubCountList = [];
    for (let subPanelID of currentPanelDivisionState.subPanelIDList) childrenSubCountList.push(getMaxSubPanelCount(subPanelID, direction, panelDivisionReference));

    // if the current division direction is the same with the query, add them up, return the sum
    if (currentPanelDivisionState.divisionDirection == direction) return childrenSubCountList.reduce((a, b) => a + b);

    // else, take the max and return
    return Math.max(...childrenSubCountList);
}

export function getLineageMaxSubPanelCount(panelID: PanelID, panelLineageList: PanelID[], direction: DivisionDirection, panelDivisionReference: PanelDivisionReference): number {
    // get the maximum number of individuals panels following a lineage in a specified direction under a panel
    const currentPanelDivisionState = panelDivisionReference[panelID];
    // end node, always return 1
    if (currentPanelDivisionState.subPanelIDList.length === 0) {
        return 1;
    }

    let childrenSubCountList = [];
    let lineageChildSubCount = -1;
    for (let subPanelID of currentPanelDivisionState.subPanelIDList) {
        const childResult = getLineageMaxSubPanelCount(subPanelID, panelLineageList, direction, panelDivisionReference);
        childrenSubCountList.push(childResult);
        if (panelLineageList.includes(subPanelID)) lineageChildSubCount = childResult;
    }

    // if the current division direction is the same with the query, add them up, return the sum
    if (currentPanelDivisionState.divisionDirection == direction) return childrenSubCountList.reduce((a, b) => a + b);

    // else, the current division direction is not the same 
    // if one of the subpanels of the current panel is in the specified lineage, then we only care about this subpanel, return its count
    if (lineageChildSubCount != -1) return lineageChildSubCount;

    // if no children is part of the subject lineage, take the max and return
    return Math.max(...childrenSubCountList);
}

export function getTrueProportionList(orgDivisionState: PanelDivision, panelResizeHandleSizeRem: number) {
    // get the true (as seen) proportion list of a division panel
    // the proportion list may not be accurate due to panel size minimum constraints
    const panelDOMElement = document.getElementById(orgDivisionState.panelID);
    const parentTotalDim = orgDivisionState.divisionDirection == "horizontal" ? panelDOMElement!.getBoundingClientRect().width : panelDOMElement!.getBoundingClientRect().height;
    const correctedTotalDim = parentTotalDim - (orgDivisionState.subPanelIDList.length - 1) * panelResizeHandleSizeRem * getRemPxSize(document);

    const fixedProportionList = [...orgDivisionState.divisionProportionList];
    for (let index = 0; (2 * index) < panelDOMElement!.childElementCount; index++) {
        const currentSubPanelElement = panelDOMElement!.children[index * 2];
        const currentDim = orgDivisionState.divisionDirection == "horizontal" ? currentSubPanelElement.getBoundingClientRect().width : currentSubPanelElement.getBoundingClientRect().height;
        fixedProportionList[index] = 100 * currentDim / correctedTotalDim;
    }

    return fixedProportionList;
}

export function shouldPanelDivide(panelID: PanelID, topPanelID: PanelID, direction: DivisionDirection, panelDivisionReference: PanelDivisionReference, config: WorkspaceConfig) {
    // get the list of ancestor panel IDs
    const panelLineage: PanelID[] = [];
    getAllParentPanelIDs(topPanelID, panelID, panelLineage, panelDivisionReference);
    // add self to the ancestor ID list
    panelLineage.unshift(panelID);

    // get the maximum number of panels in the division direction considering only the lineage of panels that contains the current panel
    // check if the workspace can contain the addition of a new panel
    const lineageMaxSubPanelCount = getLineageMaxSubPanelCount(topPanelID, panelLineage, direction, panelDivisionReference);
    const targetedMaxPanelCount = lineageMaxSubPanelCount + 1;
    const targetedDimensionRem = targetedMaxPanelCount * config!.panelMinimumDimensionRem.height + (targetedMaxPanelCount - 1) * config!.panelResizeHandleSizeRem;

    const topPanelDOMElement = document.getElementById(topPanelID);
    const maxDimension = direction == "horizontal" ? topPanelDOMElement!.getBoundingClientRect().width : topPanelDOMElement!.getBoundingClientRect().height;

    if (targetedDimensionRem * getRemPxSize(document) < maxDimension) return true;
    return false;
}

export function getAllParentPanelIDs(currentPanelID: PanelID, targetPanelID: PanelID, parentPanelIDList: PanelID[], panelDivisionReference: PanelDivisionReference) {
    // if the current panel is the parent of target panel, add current id to list, return true
    if (panelDivisionReference[currentPanelID].subPanelIDList.includes(targetPanelID)) {
        parentPanelIDList.push(currentPanelID);
        return true;
    }

    // recursively check if the subpanels of the current panel are the parent of target panel
    for (const subPanelID of panelDivisionReference[currentPanelID].subPanelIDList) {
        if (getAllParentPanelIDs(subPanelID, targetPanelID, parentPanelIDList, panelDivisionReference)) {
            parentPanelIDList.push(currentPanelID);
            return true;
        }
    }

    // current parent is not the direct parent of the target, or current panel has no subpanel, or the target panel is not under the lineage of the current panel
    return false;
}

export function recalcualteDivisionProportion(orgDivisionProportion: number[], action: "delete" | "insert", targetIndex: number, insertPosition?: "before" | "after"): number[] {
    const updatedDivisionProportionList = [...orgDivisionProportion];
    if (action == "delete") {
        // recalculate proportions after a panel is deleted
        // proportion of the deleted panel is given to the panel before it; if the deleted panel is the first panel, then the proportion is given to the panel after it
        const removedProportion = updatedDivisionProportionList[targetIndex];
        const compensatedPanelIndex = targetIndex == 0 ? targetIndex + 1 : targetIndex - 1;
        updatedDivisionProportionList[compensatedPanelIndex] += removedProportion;
        updatedDivisionProportionList.splice(targetIndex, 1);
        return updatedDivisionProportionList;
    }
    else if (action == "insert") {
        // recalcualte proportions after a panel is added
        // new panel proportion is half of the subpanel that initiated the division, identified by targetIndex
        const newSubpanelDimension = updatedDivisionProportionList[targetIndex] / 2;
        // get the insert index used in splice, if new panel is inserted after the target panel, then insert index is targetIndex, else the insert index is targetIndex+1
        const insertIndex = insertPosition == "before" ? targetIndex : targetIndex + 1;
        // adjust proportions for both the initiate panel and the new panel
        updatedDivisionProportionList[targetIndex] = newSubpanelDimension;
        updatedDivisionProportionList.splice(insertIndex, 0, newSubpanelDimension);
        return updatedDivisionProportionList;
    }
    return orgDivisionProportion; // this should never be reached
}

export function getAllPageListUnderPanel(panelID: PanelID, panelPageListReference: PanelPageListReference, panelDivisionReference: PanelDivisionReference): PageID[] {
    // recursively get all page IDs under a panel
    if (panelDivisionReference[panelID].subPanelIDList.length == 0) {
        // current panel is endpanel
        return panelPageListReference[panelID];
    }
    else if (panelDivisionReference[panelID].subPanelIDList.length > 0) {
        // current panel is a division panel
        let pageList: PageID[] = [];
        for (let subPanelID of panelDivisionReference[panelID].subPanelIDList) {
            pageList = pageList.concat(getAllPageListUnderPanel(subPanelID, panelPageListReference, panelDivisionReference));
        }
        return pageList;
    }
    return []; // Add a default return statement
}

export function getAllSubpanelIDsUnderPanel(panelID: PanelID, panelDivisionReference: PanelDivisionReference): PanelID[] {
    // recursively get all subpanel IDs under a panel
    if (panelDivisionReference[panelID].subPanelIDList.length == 0) {
        // current panel is endpanel
        return [];
    }
    else if (panelDivisionReference[panelID].subPanelIDList.length > 0) {
        // current panel is a division panel
        let subPanelList: PanelID[] = [];
        for (let subPanelID of panelDivisionReference[panelID].subPanelIDList) {
            subPanelList.push(subPanelID);
            subPanelList = subPanelList.concat(getAllSubpanelIDsUnderPanel(subPanelID, panelDivisionReference));
        }
        return subPanelList;
    }
    return []; // Add a default return statement
}

export function getParentPanelID(panelID: PanelID, panelDivisionReference: PanelDivisionReference) {
    // return the parent panel ID of a given panel, if the panel has no parent (top panel), return undefined
    for (let parentPanelID in panelDivisionReference) {
        if (panelDivisionReference[parentPanelID].subPanelIDList.includes(panelID)) return parentPanelID;
    }
}

export function createWorkspacePropsCopy(workspaceProps: WorkspaceProps) {
    // create a copy of the workspace props
    return {
        ...workspaceProps,
        pageDataReference: { ...workspaceProps.pageDataReference },
        panelPositionReference: { ...workspaceProps.panelPositionReference },
        panelFocusReference: { ...workspaceProps.panelFocusReference },
        panelDivisionReference: { ...workspaceProps.panelDivisionReference },
        panelPageListReference: { ...workspaceProps.panelPageListReference },
    } as WorkspaceProps
}

export function triggerMouseMoveOnWindow(position: { x: number, y: number }) {
    // trigger the mousemove event on the window object at the specified position
    window.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: position.x, clientY: position.y }));
}

export function isPositionInElement(e: { x: number, y: number }, elementRect: ElementRect) {
    // check if the mouse event is within the element bounding box
    if (elementRect.x > e.x ||
        e.x > (elementRect.x + elementRect.width) ||
        elementRect.y > e.y ||
        e.y > (elementRect.y + elementRect.height)) return false;
    return true;
}

export function getMousePositionDelta(position: { x: number, y: number }, startPosition: { x: number, y: number }) {
    // get the euclidean distance between the two points
    const xDelta = position.x - startPosition.x;
    const yDelta = position.y - startPosition.y;
    // distance is the square root of the sum of the squares of the two deltas
    return Math.sqrt(xDelta ** 2 + yDelta ** 2);
}

export function getWorkspaceActionFromHandler(workspaceProps: WorkspaceProps, workspaceUtility: WorkspaceUtility, workspaceConfig: WorkspaceConfig, resizeObserver: ResizeObserver) {
    return {
        createNewPageInPanel: (panelID: PanelID, newPageData?: PageData, beforePageID?: PageID) => {
            const updatedWorkspaceProps = WorkspaceActionHandler.createNewPageInPanel(workspaceProps, panelID, newPageData, beforePageID);
            WorkspaceActionHandler.dispatchWorkspacePropsUpdate(workspaceProps, updatedWorkspaceProps, workspaceUtility, resizeObserver);
        },
        createNewDivision: (initiatePanelID: PanelID, divisionDirection: DivisionDirection, newPanelPosition: "after" | "before", movedPageID?: PageID, initializeNewPanelWithNewPageData?: NewPageData) => {
            const [updatedWorkspaceProps, newPageID] = WorkspaceActionHandler.createNewDivision(workspaceProps, initiatePanelID, divisionDirection, newPanelPosition, workspaceUtility, workspaceConfig, movedPageID, initializeNewPanelWithNewPageData);
            WorkspaceActionHandler.dispatchWorkspacePropsUpdate(workspaceProps, updatedWorkspaceProps, workspaceUtility, resizeObserver);
            return newPageID
        },
        closePageInPanel: (panelID: PanelID, pageID: PageID) => {
            const updatedWorkspaceProps = WorkspaceActionHandler.closePageInPanel(workspaceProps, workspaceUtility, workspaceConfig, panelID, pageID);
            WorkspaceActionHandler.dispatchWorkspacePropsUpdate(workspaceProps, updatedWorkspaceProps, workspaceUtility, resizeObserver);
        },
        closeOtherPagesInPanel: (panelID: PanelID, initiatePageID: PageID, direction: "left" | "right" | "both") => {
            const updatedWorkspaceProps = WorkspaceActionHandler.closeOtherPagesInPanel(workspaceProps, panelID, initiatePageID, direction);
            WorkspaceActionHandler.dispatchWorkspacePropsUpdate(workspaceProps, updatedWorkspaceProps, workspaceUtility, resizeObserver);
        },
        focusPageInPanel: (panelID: PanelID, pageID: PageID) => {
            const updatedWorkspaceProps = WorkspaceActionHandler.focusPageInPanel(workspaceProps, panelID, pageID);
            WorkspaceActionHandler.dispatchWorkspacePropsUpdate(workspaceProps, updatedWorkspaceProps, workspaceUtility, resizeObserver);
        },
        movePage: (orgPanelID: PanelID, targetPanelID: PanelID, pageID: PageID, targetPositionPageID?: PageID, forced?: boolean) => {
            const updatedWorkspaceProps = WorkspaceActionHandler.movePage(workspaceProps, workspaceUtility, workspaceConfig, orgPanelID, targetPanelID, pageID, targetPositionPageID, forced);
            WorkspaceActionHandler.dispatchWorkspacePropsUpdate(workspaceProps, updatedWorkspaceProps, workspaceUtility, resizeObserver);
        },
        destroySubPanel: (parentPanelID: PanelID, subpanelID: PanelID, panelPageAction: "delete" | "move" | "ignore", pageMoveTargetPanelID?: PanelID) => {
            const updatedWorkspaceProps = WorkspaceActionHandler.destroySubPanel(workspaceProps, workspaceConfig, parentPanelID, subpanelID, panelPageAction, pageMoveTargetPanelID);
            WorkspaceActionHandler.dispatchWorkspacePropsUpdate(workspaceProps, updatedWorkspaceProps, workspaceUtility, resizeObserver);
        },
        resizePanelDivision: (panelID: PanelID, handleIndex: number, resizeStartProportionList: number[], percentageDelta: number, deltaRange: number[]) => {
            const updatedWorkspaceProps = WorkspaceActionHandler.resizePanelDivision(workspaceProps, panelID, handleIndex, resizeStartProportionList, percentageDelta, deltaRange);
            WorkspaceActionHandler.dispatchWorkspacePropsUpdate(workspaceProps, updatedWorkspaceProps, workspaceUtility, resizeObserver);
        },
        togglePageLock: (pageID: PageID) => {
            const updatedWorkspaceProps = WorkspaceActionHandler.togglePageLock(workspaceProps, pageID);
            WorkspaceActionHandler.dispatchWorkspacePropsUpdate(workspaceProps, updatedWorkspaceProps, workspaceUtility, resizeObserver);
        },
        updatePageData: (pageID: PageID, updatedPageData: Partial<PageData>) => {
            const updatedWorkspaceProps = WorkspaceActionHandler.updatePageData(workspaceProps, pageID, updatedPageData);
            WorkspaceActionHandler.dispatchWorkspacePropsUpdate(workspaceProps, updatedWorkspaceProps, workspaceUtility, resizeObserver);
        }

    } as WorkspaceAction;
}

export function getPanelPageContainerRenderedPosition(pageContainerHTMLElement: HTMLDivElement, workspaceContainerRef: RefObject<HTMLDivElement>) {
    // get the position of the page container relative to the workspace
    const rootElementRect = workspaceContainerRef.current!.getBoundingClientRect();
    const pageContainerPosition = pageContainerHTMLElement.getBoundingClientRect();
    return {
        x: pageContainerPosition.x - rootElementRect.x,
        y: pageContainerPosition.y - rootElementRect.y,
        width: pageContainerPosition.width,
        height: pageContainerPosition.height
    };
}

export function getPositionRelativeClearance(position: { x: number, y: number }, rootElementRect: ElementRect) {
    // get clearance from top, right, bottom, left of the root element
    return {
        top: (position.y - rootElementRect.y),
        right: (rootElementRect.x + rootElementRect.width - position.x),
        bottom: (rootElementRect.y + rootElementRect.height - position.y),
        left: (position.x - rootElementRect.x)
    }
}

export function getContextMenuHeightRem(contextData: ContextData, workspaceProps: WorkspaceProps, workspaceConfig: WorkspaceConfig) {
    // get the height of the context menu based on the context data
    if (contextData.type == "panelPageTab") {
        let heightRem = 0;
        // default context menu height
        let groupCount = 0, itemCount = 0;
        for (const group of PANEL_PAGE_TAB_CONTEXT_MENU_ITEMS) {
            groupCount += 1;
            itemCount += group.length;
        }
        heightRem += itemCount * workspaceConfig.contextMenuConfig.panelPageTab.itemHeightRem + (groupCount - 1) * 0.0625;
        if (workspaceProps.pageDataReference[contextData.pageID].customContextMenuItems) {
            heightRem += 0.0625 + workspaceProps.pageDataReference[contextData.pageID].customContextMenuItems!.length * workspaceConfig.contextMenuConfig.panelPageTab.itemHeightRem;
        }
        return heightRem;
    }
    return 0;
}

export function getOrderedPanelPageList(panelPageList: PageID[], pageDataReference: PageDataReference): PageID[] {
    // get the correctly ordered page list based on locked status
    // locked pages are placed at the beginning of the list
    const lockedPages = panelPageList.filter(pageID => pageDataReference[pageID].locked);
    const unlockedPages = panelPageList.filter(pageID => !pageDataReference[pageID].locked);
    return lockedPages.concat(unlockedPages);
}

export function isPageListOrderValid(panelPageList: PageID[], pageDataReference: PageDataReference): boolean {
    // check if the page ordering rule is violated
    const orderedPanelPageList = getOrderedPanelPageList(panelPageList, pageDataReference);
    return JSON.stringify(panelPageList) == JSON.stringify(orderedPanelPageList);
}

export function getPanelPageListAfterMove(orgPanelPageList: PageID[], pageID: PageID, targetPositionPageID?: PageID): PageID[] {
    const updatedPanelPageList = [...orgPanelPageList];
    // first we remove the page from list
    const movedPageIndex = updatedPanelPageList.indexOf(pageID);
    const targetPageIndex = targetPositionPageID ? updatedPanelPageList.indexOf(targetPositionPageID) : updatedPanelPageList.length - 1;
    // remove the moved page from page list only if it in the list
    if (movedPageIndex != -1) updatedPanelPageList.splice(movedPageIndex, 1);
    // then we insert the page to the target position
    updatedPanelPageList.splice(targetPageIndex, 0, pageID);
    return updatedPanelPageList;
}

export function canDropTargetAllowDrop(workspaceProps: WorkspaceProps, draggedData: DraggedData, pageID: PageID) {
    const pageData = workspaceProps.pageDataReference[pageID];
    const panelID = pageData.parentPanelID;

    // if dragged page is the same as the current target, drop does nothing
    if (draggedData.pageID == pageID) {
        return false
    }
    // for dragging a locked page
    if (workspaceProps!.pageDataReference[draggedData.pageID].locked) {
        // if the dragged page is locked and from a different panel, drop should not be allowed
        if (draggedData.panelID != panelID) {
            return false
        }
        // if the dragged page is locked and from the same panel, check if page ordering rule is violated, if violated, drop is not allowed
        else {
            const pageListAfterMove = getPanelPageListAfterMove(workspaceProps!.panelPageListReference[panelID], draggedData.pageID, pageID);
            const isValidOrder = isPageListOrderValid(pageListAfterMove, workspaceProps!.pageDataReference);
            if (!isValidOrder) {
                return false
            }
        }
    }

    // when dragged page is an unlocked page and this page is locked, show cursor as not allowed
    if (!workspaceProps!.pageDataReference[draggedData.pageID].locked && pageData.locked) {
        return false
    }
    return true;
}

export function getMostRecentFocusedPageInPanel(panelPageList: PageID[], pageDataReference: PageDataReference) {
    // get the most recent focused page in the panel
    let mostRecentTimestamp = 0;
    let mostRecentPageID = "";
    for (const pageID of panelPageList) {
        if (pageDataReference[pageID].lastFocusedTimestamp > mostRecentTimestamp) {
            mostRecentPageID = pageID;
            mostRecentTimestamp = pageDataReference[pageID].lastFocusedTimestamp;
        }
    }
    return mostRecentPageID;
}

export function getElementCenterPosition(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

export function getNewDefaultPageData(newPageID: PageID, panelID: PanelID,) {
    const newPageData = {
        pageID: newPageID,
        name: `New Page (${newPageID})`,
        parentPanelID: panelID,
        persist: false,
        creationTimestamp: Date.now(),
        lastFocusedTimestamp: Date.now(),
        renderData: {
            type: "selfManaged",
            componentInstance: <DefaultPage/>
        } as PageRenderData
    };
    return newPageData
}