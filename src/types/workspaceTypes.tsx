import { Dispatch, FC, RefObject } from "react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { ModalData, ModalInterface } from "./modalTypes";
import { MutablePageData, NewPageData, WorkspaceInterface } from "../functions/workspaceExternalInterface";


export interface WorkspaceUtility {
    setPageDataReference: Dispatch<PageDataReference>;
    setPanelPositionReference: Dispatch<PanelPositionReference>;
    setPanelFocusReference: Dispatch<PanelFocusReference>;
    setPanelDivisionReference: Dispatch<PanelDivisionReference>;
    setPanelPageListReference: Dispatch<PanelPageListReference>;
    setWorkspaceContextMenuState: Dispatch<WorkspaceContextMenuState>;
    modalInterfaceRef: RefObject<ModalInterface>;
}

export interface WorkspaceProps {
    workspaceID: WorkspaceID;
    pageDataReference: PageDataReference;
    panelPositionReference: PanelPositionReference;
    panelFocusReference: PanelFocusReference;
    panelDivisionReference: PanelDivisionReference;
    panelPageListReference: PanelPageListReference;
    topPanelID: PanelID;
    workspaceContainerRef?: RefObject<HTMLDivElement>;
    resizeObserver?: ResizeObserver;
}

export interface WorkspaceAction {
    createNewPageInPanel: (panelID: PanelID, newPageData?: PageData, beforePageID?: PageID) => void;
    createNewDivision: (initiatePanelID: string, divisionDirection: DivisionDirection, newPanelPosition: "after" | "before", movedPageID?: string, initializeNewPanelWithNewPageData?: NewPageData) => PageID | void;
    closePageInPanel: (panelID: PanelID, pageID: PageID) => void;
    closeOtherPagesInPanel: (panelID: PanelID, initiatePageID: PageID, direction: "left" | "right" | "both") => void;
    focusPageInPanel: (panelID: PanelID, pageID: PageID) => void;
    movePage: (orgPanelID: PanelID, targetPanelID: PanelID, pageID: PageID, targetPositionPageID?: PageID, forced?: boolean) => void;
    destroySubPanel: (parentPanelID: PanelID, subpanelID: PanelID, panelPageAction: "delete" | "move" | "ignore", pageMoveTargetPanelID?: PanelID) => void;
    resizePanelDivision :(panelID: PanelID, handleIndex: number, resizeStartProportionList: number[], percentageDelta: number, deltaRange: number[])=> void;
    togglePageLock: (pageID: PageID) => void;
    updatePageData: (pageID: PageID, updatedPageData: MutablePageData) => void;
}

export interface WorkspaceConfig {
    panelMinimumDimensionRem: { height: number, width: number },
    panelResizeHandleSizeRem: number,
    dragConfig: DragConfig,
    contextMenuConfig: {
        panelPageTab: {
            itemHeightRem: number,
            itemWidthRem: number,
        },
    }
}

export interface DragConfig {
    edgeScrollActiveWidthRem: number,
    edgeScrollMinSpeed: number,
    edgeScrollMaxSpeed: number,
    dropSplitActivationPriority: "x"|"y",
    dropSplitActivationPercentage:{
        x:number,
        y:number,
    },
    dragActivationThresholdRem: number
}

export type WorkspaceID = string;
export type PanelID = string;
export type PageID = string;

export interface PageData {
    pageID: PageID;
    name: string;
    icon?: IconDefinition;
    parentPanelID: PanelID;
    persist: boolean;
    confirmClose?: boolean;
    locked?: boolean;
    customContextMenuItems?: ContextMenuItem[];
    creationTimestamp: number;
    lastFocusedTimestamp: number;
    renderData:  PageRenderData
}
export type PageRenderData = {
    type: "selfManaged",
    componentInstance: JSX.Element
} | {
    type: "externallyManaged",
}
export interface ContextMenuItem {
    key: string;
    label: string;
    icon?: IconDefinition;
    action: (workspaceInterface:WorkspaceInterface, pageID:PageID) => void;
    disabled: boolean;
}


export interface PanelPosition {
    panelID: PanelID;
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface PanelDivision {
    panelID: PanelID;
    subPanelIDList: PanelID[];
    divisionDirection: DivisionDirection;
    divisionProportionList: number[];
}
export type PageDataReference = { [key: PageID]: PageData; };
export type PanelPositionReference = { [key: PanelID]: PanelPosition; };
export type PanelFocusReference = { [key: PanelID]: PageID; };
export type PanelDivisionReference = { [key: PanelID]: PanelDivision; };
export type PanelPageListReference = { [key: PanelID]: PageID[]; };

export type DivisionDirection = "horizontal" | "vertical" | null;

export type DraggedData = {
    type: "tab",
    panelID: PanelID,
    pageID: PageID,
    startPosition: { x: number, y: number },
} | {
    type: "pageListItem",
    panelID: PanelID,
    pageID: PageID,
    startPosition: { x: number, y: number },
    startPositionRelative: { leftProportion: number, topProportion: number },
}

export interface WorkspaceDragProps {
    workspaceMask: "workspace" | "pageContainer" | null;
    setWorkspaceMask: Dispatch<"workspace" | "pageContainer" | null>;
    draggedData: DraggedData | null;
    setDraggedData: Dispatch<DraggedData | null>;
    dragCursorStyle: string;
    setDragCursorStyle: Dispatch<string>;
}
export interface ElementRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface WorkspaceContextMenuState {
    relativeMousePosition: { x: number, y: number },
    relativeClearance: { left: number, right: number, top: number, bottom: number},
    contextData: ContextData | null,
};

export interface ContextData {
    type: "panelPageTab",
    pageID: PageID,
} 