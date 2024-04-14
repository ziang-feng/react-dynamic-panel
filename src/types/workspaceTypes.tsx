import { Dispatch, FC, Ref, RefObject } from "react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { ModalData } from "./modalTypes";


export interface WorkspaceUtility {
    setActivePanelID: Dispatch<string>;
    setPageDataReference: Dispatch<PageDataReference>;
    setPanelPositionReference: Dispatch<PanelPositionReference>;
    setPanelFocusReference: Dispatch<PanelFocusReference>;
    setPanelDivisionReference: Dispatch<PanelDivisionReference>;
    setPanelPageListReference: Dispatch<PanelPageListReference>;
    setDraggedData: Dispatch<DraggedData|null>;
    showModalWithData?: (modalData: ModalData) => void;
    hideModal?: () => void;
}

export interface WorkspaceProps {
    workspaceID: WorkspaceID;
    activePanelID: PanelID;
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
    createNewPageInPanel: (panelID: PanelID, newPageData?: PageData, afterPageID?: PageID) => WorkspaceProps;
    createNewDivision: (initiatePanelID: string, divisionDirection: DivisionDirection, newPanelPosition: "after" | "before", movedPageID?: string | undefined) => WorkspaceProps;
    closePageInPanel: (panelID: PanelID, pageID: PageID) => WorkspaceProps;
    focusPageInPanel: (panelID: PanelID, pageID: PageID) => WorkspaceProps;
    movePage: (orgPanelID: PanelID, targetPanelID: PanelID, pageID: PageID, targetPositionPageID?: PageID) => WorkspaceProps;
    destroySubPanel: (parentPanelID: PanelID, subpanelID: PanelID, panelPageAction: "delete" | "move" | "ignore", pageMoveTargetPanelID?: PanelID) => WorkspaceProps;
    resizePanelDivision :(panelID: PanelID, handleIndex: number, resizeStartProportionList: number[], percentageDelta: number, deltaRange: number[])=> WorkspaceProps;
}

export interface WorkspaceConfig {
    panelMinimumDimensionRem: { height: number, width: number },
    panelResizeHandleSizeRem: number,
    dragConfig: DragConfig,
    panelPageTabConfig: {
        contextMenuItemHeightRem: number,
        contextMenuWidthRem: number,
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
    component: FC;
    parentPanelID: PanelID;
    persist: boolean;
    preservedState?: any;
    props?: any;
    confirmClose?: boolean;
    locked?: boolean;
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

export interface ContextMenuDisplayState {
    relativeAnchorPosition: { x: number, y: number };
    clearanceRem: { left: number, right: number, top: number, bottom: number};
    visible: boolean;
}