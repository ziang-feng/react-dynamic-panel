import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { ContextMenuItem, DivisionDirection, PageData, PageID, PageRenderData, PanelID, WorkspaceAction, WorkspaceConfig, WorkspaceProps, WorkspaceUtility } from "../types/workspaceTypes";
import { getNewDefaultPageData, getParentPanelID, getSafeRandomID, getTrueProportionList } from "./utility";
import { ModalInterface } from "../types/modalTypes";
import { createContext } from "react";

// for exposed workspace data accessor and actions
export const PageComponentIDContext = createContext<PageID>("");
export interface WorkspaceInterface {
    dataAccessor: {
        workspaceID: string;
        topPanelID: PanelID;
        panelDataReference: { [key: PanelID]: PanelDataExternal };
        pageDataReference: { [key: PageID]: PageDataExternal };
        workspaceContainerRef: React.RefObject<HTMLDivElement>;
    },
    externalAction: {
        createNewDefaultPageInPanel: (panelID: PanelID, beforePageID?: PageID) => PageID | void;
        createNewPageInPanel: (panelID: PanelID, newPageData: NewPageData, beforePageID?: PageID) => PageID | void;
        dividePagePanel: (pagePanelID: PanelID, divisionDirection: DivisionDirection, newPanelPosition: "after" | "before", initializeNewPanelWithNewPageData?: NewPageData) => PageID | void;
        addSubPanelToDivisionPanel: (divisionPanelID: PanelID, beforePanelID?: PanelID, initializeNewPanelWithNewPageData?: NewPageData) => PageID | void;
        closePageInPanel: (panelID: PanelID, pageID: PageID) => void;
        closeOtherPagesInPanel: (panelID: PanelID, initiatePageID: PageID, direction: "left" | "right" | "both") => void;
        focusPageInPanel: (panelID: PanelID, pageID: PageID) => void;
        movePage: (orgPanelID: PanelID, targetPanelID: PanelID, pageID: PageID, targetPositionPageID?: PageID, forced?: boolean) => void;
        destroySubPanel: (parentPanelID: PanelID, subpanelID: PanelID, panelPageAction: "delete" | "move", pageMoveTargetPanelID?: PanelID) => void;
        updatePanelDivisionProportion: (panelID: PanelID, divisionProportionList: number[]) => void;
        lockPage: (pageID: PageID) => void;
        unlockPage: (pageID: PageID) => void;
        updatePageData: (pageID: PageID, updatedPageData: MutablePageData) => void;
    },
    modalInterfaceRef: React.RefObject<ModalInterface>
}

export type PanelDataExternal = {
    readonly type: "PagePanel",
    readonly panelID: PanelID,
    readonly parentPanelID?: PanelID,
    readonly pageIDList: PageID[],
    readonly focusedPageID: PageID,
    readonly pageContainerBoundingBox: { x: number, y: number, width: number, height: number } | undefined,
    readonly selfProportion?: number,
} | {
    readonly type: "DivisionPanel",
    readonly panelID: PanelID,
    readonly parentPanelID?: PanelID,
    readonly divisionDirection: DivisionDirection,
    readonly divisionProportionList: number[],
    readonly subPanelIDList: PanelID[],
    readonly selfProportion?: number,
}

export type PageDataExternal = {
    readonly pageID: PageID,
    readonly parentPanelID: PanelID,
    readonly name: string,
    readonly icon?: IconDefinition;
    readonly persist: boolean,
    readonly confirmClose?: boolean,
    readonly locked?: boolean,
    readonly customContextMenuItems?: ContextMenuItem[],
    readonly creationTimestamp: number,
    readonly lastFocusedTimestamp: number,
    readonly renderData: {
        type: "selfManaged"
        readonly componentInstance: JSX.Element
    } | {
        type: "externallyManaged"
    }
}
export interface NewPageData {
    name: PageID;
    icon?: IconDefinition;
    persist: boolean;
    confirmClose?: boolean;
    customContextMenuItems?: ContextMenuItem[];
    renderData: PageRenderData;
}
export interface MutablePageData extends Partial<NewPageData> { }

export function getWorkspaceDataAccessor(workspaceProps: WorkspaceProps, workspaceConfig: WorkspaceConfig) {
    const panelDataReferenceExternal: { [key: PanelID]: PanelDataExternal } = {};
    const pageDataReferenceExternal: { [key: PageID]: PageDataExternal } = {};

    for (const panelID in workspaceProps.panelDivisionReference) {
        const panelDivision = workspaceProps.panelDivisionReference[panelID];
        const parentPanelID = getParentPanelID(panelID, workspaceProps.panelDivisionReference);
        const selfProportion = parentPanelID ? getTrueProportionList(workspaceProps.panelDivisionReference[parentPanelID], workspaceConfig.panelResizeHandleSizeRem)[workspaceProps.panelDivisionReference[parentPanelID].subPanelIDList.indexOf(panelID)] : undefined;
        if (panelDivision.subPanelIDList.length == 0) {
            // panel that contains pages
            panelDataReferenceExternal[panelID] = {
                type: "PagePanel",
                panelID: panelID,
                parentPanelID: parentPanelID,
                pageIDList: [...workspaceProps.panelPageListReference[panelID]],
                focusedPageID: workspaceProps.panelFocusReference[panelID],
                pageContainerBoundingBox: { ...workspaceProps.panelPositionReference[panelID] },
                selfProportion: selfProportion
            }
        }
        else {
            const trueProportionList = getTrueProportionList(panelDivision, workspaceConfig.panelResizeHandleSizeRem);
            // panel that contains subpanels
            panelDataReferenceExternal[panelID] = {
                type: "DivisionPanel",
                panelID: panelID,
                parentPanelID: parentPanelID,
                subPanelIDList: [...panelDivision.subPanelIDList],
                divisionDirection: panelDivision.divisionDirection,
                divisionProportionList: trueProportionList,
                selfProportion: selfProportion
            }
        }
    }

    for (const pageID in workspaceProps.pageDataReference) {
        const pageData = workspaceProps.pageDataReference[pageID];
        pageDataReferenceExternal[pageID] = {
            pageID: pageID,
            parentPanelID: pageData.parentPanelID,
            name: pageData.name,
            icon: pageData.icon,
            persist: pageData.persist,
            confirmClose: pageData.confirmClose,
            locked: pageData.locked,
            customContextMenuItems: pageData.customContextMenuItems ? [...pageData.customContextMenuItems] : undefined,
            creationTimestamp: pageData.creationTimestamp,
            lastFocusedTimestamp: pageData.lastFocusedTimestamp,
            renderData: pageData.renderData
        }
    }

    return {
        workspaceID: workspaceProps.workspaceID,
        topPanelID: workspaceProps.topPanelID,
        panelDataReference: panelDataReferenceExternal,
        pageDataReference: pageDataReferenceExternal,
        workspaceContainerRef: workspaceProps.workspaceContainerRef!
    }
}

export function getWorkspaceExternalAction(workspaceProps: WorkspaceProps, workspaceUtility: WorkspaceUtility, workspaceAction: WorkspaceAction) {
    // note: for all functions that make changes to panel page list, the final page list will be forced to respect the ordering rule (locked pages before unlocked pages)
    return {
        createNewDefaultPageInPanel: (panelID: PanelID, beforePageID?: PageID) => {
            if (!(panelID in workspaceProps.panelDivisionReference)) {
                console.error(`Panel ${panelID} does not exist`);
                return;
            }
            if (workspaceProps.panelDivisionReference[panelID].subPanelIDList.length > 0) {
                console.error(`Panel ${panelID} is not a page panel`);
                return;
            }
            if (beforePageID && !workspaceProps.panelPageListReference[panelID].includes(beforePageID)) {
                console.error(`Page ${beforePageID} does not exist in panel ${panelID}`);
                return;
            }
            const newPageID = getSafeRandomID(workspaceProps.workspaceID, "page", workspaceProps);
            const newPageData = getNewDefaultPageData(newPageID, panelID);
            workspaceAction.createNewPageInPanel(panelID, newPageData, beforePageID);
            return newPageID;
        },
        createNewPageInPanel: (panelID: PanelID, newPageData: NewPageData, beforePageID?: PageID) => {
            if (!(panelID in workspaceProps.panelDivisionReference)) {
                console.error(`Panel ${panelID} does not exist`);
                return;
            }
            if (workspaceProps.panelDivisionReference[panelID].subPanelIDList.length > 0) {
                console.error(`Panel ${panelID} is not a page panel`);
                return;
            }
            if (beforePageID && !workspaceProps.panelPageListReference[panelID].includes(beforePageID)) {
                console.error(`Page ${beforePageID} does not exist in panel ${panelID}`);
                return;
            }
            const newPageID = getSafeRandomID(workspaceProps.workspaceID, "page", workspaceProps);
            const finalNewPageData: PageData = {
                pageID: newPageID,
                name: newPageData.name,
                icon: newPageData.icon,
                parentPanelID: panelID,
                persist: newPageData.persist,
                confirmClose: newPageData.confirmClose,
                creationTimestamp: Date.now(),
                lastFocusedTimestamp: Date.now(),
                customContextMenuItems: newPageData.customContextMenuItems,
                renderData: newPageData.renderData
            }
            workspaceAction.createNewPageInPanel(panelID, finalNewPageData, beforePageID);
            return newPageID;
        },
        dividePagePanel: (pagePanelID: PanelID, divisionDirection: DivisionDirection, newPanelPosition: "after" | "before", initializeNewPanelWithNewPageData?: NewPageData) => {
            if (!(pagePanelID in workspaceProps.panelDivisionReference)) {
                console.error(`Panel ${pagePanelID} does not exist`);
                return;
            }
            if (workspaceProps.panelDivisionReference[pagePanelID].subPanelIDList.length > 0) {
                console.error(`Panel ${pagePanelID} is not a page panel`);
                return;
            }
            const newPageID = workspaceAction.createNewDivision(pagePanelID, divisionDirection, newPanelPosition, undefined, initializeNewPanelWithNewPageData);
            return newPageID;
        },
        addSubPanelToDivisionPanel: (divisionPanelID: PanelID, beforePanelID?: PanelID, initializeNewPanelWithNewPageData?: NewPageData) => {
            if (!(divisionPanelID in workspaceProps.panelDivisionReference)) {
                console.error(`Panel ${divisionPanelID} does not exist`);
                return;
            }
            if (workspaceProps.panelDivisionReference[divisionPanelID].subPanelIDList.length == 0) {
                console.error(`Panel ${divisionPanelID} is not a division panel`);
                return;
            }
            if (beforePanelID && !workspaceProps.panelDivisionReference[divisionPanelID].subPanelIDList.includes(beforePanelID)) {
                console.error(`Subpanel ${beforePanelID} does not exist in panel ${divisionPanelID}`);
                return;
            }
            const divisionDirection = workspaceProps.panelDivisionReference[divisionPanelID].divisionDirection;

            // if beforePanelID is provided, the new subpanel is created before the beforePanel; else, it is created after the last subpanel
            const lastSubPanelID = workspaceProps.panelDivisionReference[divisionPanelID].subPanelIDList[workspaceProps.panelDivisionReference[divisionPanelID].subPanelIDList.length - 1];
            const initiatedPanelID = beforePanelID ? beforePanelID : lastSubPanelID;
            const newPanelPosition = beforePanelID ? "before" : "after";

            const newPageID = workspaceAction.createNewDivision(initiatedPanelID, divisionDirection, newPanelPosition, undefined, initializeNewPanelWithNewPageData);
            return newPageID;
        },
        closePageInPanel: (panelID: PanelID, pageID: PageID) => {
            if (!(panelID in workspaceProps.panelDivisionReference)) {
                console.error(`Panel ${panelID} does not exist`);
                return;
            }
            if (workspaceProps.panelDivisionReference[panelID].subPanelIDList.length > 0) {
                console.error(`Panel ${panelID} is not a page panel`);
                return;
            }
            if (!workspaceProps.panelPageListReference[panelID].includes(pageID)) {
                console.error(`Page ${pageID} does not exist in panel ${panelID}`);
                return;
            }
            workspaceAction.closePageInPanel(panelID, pageID);
        },
        closeOtherPagesInPanel: (panelID: PanelID, initiatePageID: PageID, direction: "left" | "right" | "both") => {
            if (!(panelID in workspaceProps.panelDivisionReference)) {
                console.error(`Panel ${panelID} does not exist`);
                return;
            }
            if (workspaceProps.panelDivisionReference[panelID].subPanelIDList.length > 0) {
                console.error(`Panel ${panelID} is not a page panel`);
                return;
            }
            if (!workspaceProps.panelPageListReference[panelID].includes(initiatePageID)) {
                console.error(`Page ${initiatePageID} does not exist in panel ${panelID}`);
                return;
            }
            workspaceAction.closeOtherPagesInPanel(panelID, initiatePageID, direction);
        },
        focusPageInPanel: (panelID: PanelID, pageID: PageID) => {
            if (!(panelID in workspaceProps.panelDivisionReference)) {
                console.error(`Panel ${panelID} does not exist`);
                return;
            }
            if (workspaceProps.panelDivisionReference[panelID].subPanelIDList.length > 0) {
                console.error(`Panel ${panelID} is not a page panel`);
                return;
            }
            if (!workspaceProps.panelPageListReference[panelID].includes(pageID)) {
                console.error(`Page ${pageID} does not exist in panel ${panelID}`);
                return;
            }
            workspaceAction.focusPageInPanel(panelID, pageID);
        },
        movePage: (orgPanelID: PanelID, targetPanelID: PanelID, pageID: PageID, targetPositionPageID?: PageID, forced?: boolean) => {
            if (!(orgPanelID in workspaceProps.panelDivisionReference)) {
                console.error(`Panel ${orgPanelID} does not exist`);
                return;
            }
            if (!(targetPanelID in workspaceProps.panelDivisionReference)) {
                console.error(`Panel ${targetPanelID} does not exist`);
                return;
            }
            if (!workspaceProps.panelPageListReference[orgPanelID].includes(pageID)) {
                console.error(`Page ${pageID} does not exist in panel ${orgPanelID}`);
                return;
            }
            if (targetPositionPageID && !workspaceProps.panelPageListReference[targetPanelID].includes(targetPositionPageID)) {
                console.error(`Target position page ${targetPositionPageID} does not exist in target panel ${targetPanelID}`);
                return;
            }
            workspaceAction.movePage(orgPanelID, targetPanelID, pageID, targetPositionPageID, forced);
        },
        destroySubPanel: (parentPanelID: PanelID, subpanelID: PanelID, panelPageAction: "delete" | "move", pageMoveTargetPanelID?: PanelID) => {
            if (!(parentPanelID in workspaceProps.panelDivisionReference)) {
                console.error(`Parent Panel ${parentPanelID} does not exist`);
                return;
            }
            if (workspaceProps.panelDivisionReference[parentPanelID].subPanelIDList.length == 0) {
                console.error(`Parent Panel ${parentPanelID} is not a division panel`);
                return;
            }
            if (!workspaceProps.panelDivisionReference[parentPanelID].subPanelIDList.includes(subpanelID)) {
                console.error(`Subpanel ${subpanelID} does not exist in parent panel ${parentPanelID}`);
                return;
            }
            workspaceAction.destroySubPanel(parentPanelID, subpanelID, panelPageAction, pageMoveTargetPanelID);
        },
        updatePanelDivisionProportion: (panelID: PanelID, divisionProportionList: number[]) => {
            if (!(panelID in workspaceProps.panelDivisionReference)) {
                console.error(`Panel ${panelID} does not exist`);
                return;
            }
            if (workspaceProps.panelDivisionReference[panelID].subPanelIDList.length == 0) {
                console.error(`Panel ${panelID} is not a division panel`);
                return;
            }
            if (divisionProportionList.length != workspaceProps.panelDivisionReference[panelID].subPanelIDList.length) {
                console.error(`Division proportion list length does not match subpanel count`);
                return;
            }
            workspaceUtility.setPanelDivisionReference({ ...workspaceProps.panelDivisionReference, [panelID]: { ...workspaceProps.panelDivisionReference[panelID], divisionProportionList: divisionProportionList } });
        },
        lockPage: (pageID: PageID) => {
            if (!(pageID in workspaceProps.pageDataReference)) {
                console.error(`Page ${pageID} does not exist`);
                return;
            }
            if (workspaceProps.pageDataReference[pageID].locked) {
                console.warn(`Page ${pageID} is already locked`);
                return;
            }
            workspaceAction.togglePageLock(pageID);
        },
        unlockPage: (pageID: PageID) => {
            if (!(pageID in workspaceProps.pageDataReference)) {
                console.error(`Page ${pageID} does not exist`);
                return;
            }
            if (!workspaceProps.pageDataReference[pageID].locked) {
                console.warn(`Page ${pageID} is already unlocked`);
                return;
            }
            workspaceAction.togglePageLock(pageID);
        },
        updatePageData: (pageID: PageID, updatedPageData: MutablePageData) => {
            if (!(pageID in workspaceProps.pageDataReference)) {
                console.error(`Page ${pageID} does not exist`);
                return;
            }
            // validate context menu item key uniqueness
            if (updatedPageData.customContextMenuItems) {
                const keyList = updatedPageData.customContextMenuItems.map(item => item.key);
                if (new Set(keyList).size != keyList.length) {
                    console.error(`Duplicate context menu item keys`);
                    return;
                }
            }
            workspaceAction.updatePageData(pageID, updatedPageData);
        },
    }
}