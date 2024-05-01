import DefaultPage from "../components/defaultPage";
import { CloseDefaultPageAlert, CloseLockedPageAlert, MoveLockedPageNewPanelAlert, MoveLockedPageOutPanelAlert, MovePageAlert, PanelSplitAlert } from "../components/modalComponents/alert";
import { WorkspaceUtility, WorkspaceProps, PanelID, PageData, PageID, WorkspaceConfig, DivisionDirection, PageRenderData } from "../types/workspaceTypes";
import { createWorkspacePropsCopy, getAllPageListUnderPanel, getAllSubpanelIDsUnderPanel, getParentPanelID, getTrueProportionList, getSafeRandomID, recalcualteDivisionProportion, shouldPanelDivide, getOrderedPanelPageList, getPanelPageListAfterMove, isPageListOrderValid, getMostRecentFocusedPageInPanel, getNewDefaultPageData } from "./utility";
import { MutablePageData, NewPageData } from "./workspaceExternalInterface";

namespace WorkspaceActionHandler {
    export function createNewPageInPanel(workspaceProps: WorkspaceProps, panelID: PanelID, newPageData?: PageData, beforePageID?: PageID): WorkspaceProps {
        const updatedWorkspaceProps = createWorkspacePropsCopy(workspaceProps);
        if (!newPageData) {
            const newPageID = getSafeRandomID(workspaceProps.workspaceID, "page", updatedWorkspaceProps);
            newPageData = getNewDefaultPageData(newPageID, panelID);
        }
        newPageData.parentPanelID = panelID;

        // create new page data reference
        updatedWorkspaceProps.pageDataReference[newPageData.pageID] = newPageData;

        // set panel to focus on the new page
        updatedWorkspaceProps.panelFocusReference[panelID] = newPageData.pageID;

        // add new pageID to panel page list
        const newPanelPageList = [...updatedWorkspaceProps.panelPageListReference[panelID]];
        if (beforePageID) {
            const insertIndex = newPanelPageList.indexOf(beforePageID);
            newPanelPageList.splice(insertIndex, 0, newPageData.pageID);
        }
        else newPanelPageList.push(newPageData.pageID);

        // make the resulting page list respect the ordering rule (locked pages before unlocked pages)
        const correctedPanelPageList = getOrderedPanelPageList(newPanelPageList, updatedWorkspaceProps.pageDataReference);
        updatedWorkspaceProps.panelPageListReference[panelID] = correctedPanelPageList;

        return updatedWorkspaceProps;
    }

    export function createNewDivision(workspaceProps: WorkspaceProps, initiatePanelID: PanelID, divisionDirection: DivisionDirection, newPanelPosition: "after" | "before", workspaceUtility: WorkspaceUtility, config: WorkspaceConfig, movedPageID?: PageID, initializeNewPanelWithNewPageData?: NewPageData): [WorkspaceProps, PageID | void] {
        // if movedPage, new Panel is created by dragging a page tab from a panel to the initiatePanel
        // else, new Panel is created by clicking the split button, we need to create a new default page
        // it is garanteed that the initiatePanel is an end panel

        // before any operation, we need to calculate if the workspace has enough space to create a new division
        // in case where a page is moved, the original panel may be destroyed, we need to take this into account; it is easier to calculate the new divisionReference after the panel removal before checking if the workspace has enough space
        // it is also possible that the initiatePanel is also destroyed due to the destroyed panel being the only sibling of the initiatePanel; in this case, initiatePanel would become the parent panel of the initiatePanel

        // if new division is created by page move, and the moved page is locked, we do not allow this action
        if (movedPageID && workspaceProps.pageDataReference[movedPageID].locked) {
            workspaceUtility.modalInterfaceRef.current!.showModalWithData!({ innerComponent: <MoveLockedPageNewPanelAlert dismissCallback={workspaceUtility.modalInterfaceRef.current!.hideModal!} movedPageData={workspaceProps.pageDataReference[movedPageID]} /> });
            return [workspaceProps, undefined];
        }
        let updatedWorkspaceProps = createWorkspacePropsCopy(workspaceProps);
        let isMovedPagePanelDistroyed = false;
        let movedPagePanelID: PanelID | null = null;
        if (movedPageID) {
            movedPagePanelID = workspaceProps.pageDataReference[movedPageID].parentPanelID;
            if (workspaceProps.panelPageListReference[movedPagePanelID].length == 1) {
                // if the original panel only has one page, it will be destroyed after the page is moved
                isMovedPagePanelDistroyed = true;
                // if orgpanel is top panel, don't do anything
                if (movedPagePanelID == workspaceProps.topPanelID) return [workspaceProps, undefined];

                // if orgpanel is also initiatePanel, this action changes nothing (remove the original panel and create a new panel in the same position)
                if (movedPagePanelID == initiatePanelID) return [workspaceProps, undefined];

                // get updated props after the panel is removed
                const destroyedPanelParent = getParentPanelID(movedPagePanelID, workspaceProps.panelDivisionReference)!;
                if (updatedWorkspaceProps.panelDivisionReference[destroyedPanelParent].subPanelIDList.length == 2 && updatedWorkspaceProps.panelDivisionReference[destroyedPanelParent].subPanelIDList.includes(initiatePanelID)) {
                    // if destroyedPanel and initiatePanel are the only children of a parent panel, we can take a shortcut and only update the parent panel division direction, proportion, and subpanelIDList
                    const updatedParentDivision = {
                        ...updatedWorkspaceProps.panelDivisionReference[destroyedPanelParent],
                        divisionDirection: divisionDirection,
                        divisionProportionList: [50, 50],
                        subPanelIDList: newPanelPosition == "after" ? [initiatePanelID, movedPagePanelID] : [movedPagePanelID, initiatePanelID],
                    };
                    updatedWorkspaceProps.panelDivisionReference[destroyedPanelParent] = updatedParentDivision;
                    return [updatedWorkspaceProps, undefined];
                }
                updatedWorkspaceProps = destroySubPanel(workspaceProps, config, destroyedPanelParent, movedPagePanelID, "ignore");
                // after deletion, movedPage's parent panel ID is stale, need to update it
            }
        }
        // now we can check if the workspace has enough space after panel deletion
        if (!shouldPanelDivide(initiatePanelID, workspaceProps.topPanelID, divisionDirection, updatedWorkspaceProps.panelDivisionReference, config)) {
            // if not, show modal notification and return
            workspaceUtility.modalInterfaceRef.current!.showModalWithData!({ innerComponent: <PanelSplitAlert dismissCallback={workspaceUtility.modalInterfaceRef.current!.hideModal!} divisionDirection={divisionDirection} /> });
            return [workspaceProps, undefined];
        }

        // the new division is possible
        // handle new page data
        let newPageID: PageID;
        if (movedPageID) {
            // if page is moved, no need to create new page, just need to move the page to the new division
            newPageID = movedPageID;
        } else {
            // if page is not moved, create new page
            if (initializeNewPanelWithNewPageData) {
                // create new page with the provided component
                const passedInPageData = initializeNewPanelWithNewPageData;
                newPageID = getSafeRandomID(workspaceProps.workspaceID, "page", workspaceProps);
                const pageData:PageData = {
                    pageID: newPageID,
                    name: passedInPageData.name,
                    icon: passedInPageData.icon,
                    parentPanelID: "",
                    persist: passedInPageData.persist,
                    confirmClose: passedInPageData.confirmClose,
                    creationTimestamp: Date.now(),
                    lastFocusedTimestamp: Date.now(),
                    customContextMenuItems: passedInPageData.customContextMenuItems,
                    renderData: passedInPageData.renderData
                }
                updatedWorkspaceProps.pageDataReference[newPageID] = pageData;
            }
            else {
                // create new default page
                newPageID = getSafeRandomID(workspaceProps.workspaceID, "page", updatedWorkspaceProps);
                const newPageData = getNewDefaultPageData(newPageID, "");
                updatedWorkspaceProps.pageDataReference[newPageID] = newPageData;
            }
        }
        // note that the parentPanelID of the newPageData is not set (or incorrect in case of movedPage), it will be set after the new division is created

        // if movedPage, we first detach the page from the original panel if it is not destroyed
        if (movedPageID && !isMovedPagePanelDistroyed) {
            // set panel to focus on the next page in page list; if moved page is the last page, focus on the new last page
            const orgPanelPageList = [...updatedWorkspaceProps.panelPageListReference[movedPagePanelID!]];
            const movedPageIndex = orgPanelPageList.indexOf(movedPageID);
            const newFocusIndex = movedPageIndex == orgPanelPageList.length - 1 ? movedPageIndex - 1 : movedPageIndex + 1;
            updatedWorkspaceProps.panelFocusReference[movedPagePanelID!] = orgPanelPageList[newFocusIndex];

            // remove pageID from panelpagelist
            orgPanelPageList.splice(movedPageIndex, 1);
            updatedWorkspaceProps.panelPageListReference[movedPagePanelID!] = orgPanelPageList;
        }

        // create new division
        // check the division direction, if the new division direction is the same as the division direction of the parent panel of the initiatePanel, then create a new subpanel in the parent
        const parentPanelID = getParentPanelID(initiatePanelID, updatedWorkspaceProps.panelDivisionReference);
        if (parentPanelID == undefined || divisionDirection != updatedWorkspaceProps.panelDivisionReference[parentPanelID].divisionDirection) {
            // if parentpanel is undefined, then initiatePanel is a top panel, need to initiate division for initiatePanel
            // or if the parent division direction is different, need to initiate division for initiatePanel

            // first, we need to create two new subpanels
            // one of the subpanel will inherent the division, focus, and the pagelist of the initiatePanel; the other will be a new panel containing the new page (or the moved page)
            const inherentSubPanelID = getSafeRandomID(workspaceProps.workspaceID, "panel", updatedWorkspaceProps);
            const inherentSubPanel = {
                panelID: inherentSubPanelID,
                division: {
                    ...updatedWorkspaceProps.panelDivisionReference[initiatePanelID],
                    panelID: inherentSubPanelID
                },
                focus: updatedWorkspaceProps.panelFocusReference[initiatePanelID],
                pageList: updatedWorkspaceProps.panelPageListReference[initiatePanelID],
            };

            // register the division, focus, and pagelist for inherent sub panel
            updatedWorkspaceProps.panelDivisionReference[inherentSubPanel.panelID] = inherentSubPanel.division;
            updatedWorkspaceProps.panelFocusReference[inherentSubPanel.panelID] = inherentSubPanel.focus;
            updatedWorkspaceProps.panelPageListReference[inherentSubPanel.panelID] = inherentSubPanel.pageList;

            const newSubPanelID = getSafeRandomID(workspaceProps.workspaceID, "panel", updatedWorkspaceProps);
            const newSubPanel = {
                panelID: newSubPanelID,
                division: {
                    panelID: newSubPanelID,
                    subPanelIDList: [],
                    divisionDirection: null,
                    divisionProportionList: [],
                },
                focus: newPageID,
                pageList: [newPageID],
            }

            // clear the initiatePanel's focus, and pagelist
            delete updatedWorkspaceProps.panelFocusReference[initiatePanelID];
            delete updatedWorkspaceProps.panelPageListReference[initiatePanelID];

            // register the division, focus, and pagelist for the new subpanel
            updatedWorkspaceProps.panelDivisionReference[newSubPanel.panelID] = newSubPanel.division;
            updatedWorkspaceProps.panelFocusReference[newSubPanel.panelID] = newSubPanel.focus;
            updatedWorkspaceProps.panelPageListReference[newSubPanel.panelID] = newSubPanel.pageList;

            // update division for initiatePanel
            updatedWorkspaceProps.panelDivisionReference[initiatePanelID] = {
                panelID: initiatePanelID,
                subPanelIDList: newPanelPosition == "after" ? [inherentSubPanel.panelID, newSubPanel.panelID] : [newSubPanel.panelID, inherentSubPanel.panelID],
                divisionDirection: divisionDirection,
                divisionProportionList: [50, 50],
            };

            // set parentPanelID for newPage
            updatedWorkspaceProps.pageDataReference[newPageID].parentPanelID = newSubPanelID;

            // update parentPanelID for pages in inherentSubPanel
            for (const pageID of inherentSubPanel.pageList) {
                updatedWorkspaceProps.pageDataReference[pageID] = {
                    ...updatedWorkspaceProps.pageDataReference[pageID],
                    parentPanelID: inherentSubPanel.panelID,
                }
            }

            // remove position reference for initiatePanel since it is no longer an end panel
            delete updatedWorkspaceProps.panelPositionReference[initiatePanelID];
        }
        else if (divisionDirection == updatedWorkspaceProps.panelDivisionReference[parentPanelID].divisionDirection) {
            // if the parent division direction is the same, create a new subpanel in the parent
            // create new sub panel
            const newSubPanelID = getSafeRandomID(workspaceProps.workspaceID, "panel", updatedWorkspaceProps);
            const newSubPanel = {
                panelID: newSubPanelID,
                division: {
                    panelID: newSubPanelID,
                    subPanelIDList: [],
                    divisionDirection: null,
                    divisionProportionList: [],
                },
                focus: newPageID,
                pageList: [newPageID],
            }

            // register the division, focus, and pagelist for the new subpanel
            updatedWorkspaceProps.panelDivisionReference[newSubPanel.panelID] = newSubPanel.division;
            updatedWorkspaceProps.panelFocusReference[newSubPanel.panelID] = newSubPanel.focus;
            updatedWorkspaceProps.panelPageListReference[newSubPanel.panelID] = newSubPanel.pageList;

            // update parent panel division
            const updatedParentDivision = {
                ...updatedWorkspaceProps.panelDivisionReference[parentPanelID],
                subPanelIDList: [...updatedWorkspaceProps.panelDivisionReference[parentPanelID].subPanelIDList],
                divisionProportionList: getTrueProportionList(updatedWorkspaceProps.panelDivisionReference[parentPanelID], config.panelResizeHandleSizeRem),
            }
            // insert new sub panel into subPanelIDList
            const targetPanelIndex = updatedParentDivision.subPanelIDList.indexOf(initiatePanelID);
            const insertIndex = targetPanelIndex + (newPanelPosition == "after" ? 1 : 0);
            updatedParentDivision.subPanelIDList.splice(insertIndex, 0, newSubPanelID);
            updatedParentDivision.divisionProportionList = recalcualteDivisionProportion(updatedParentDivision.divisionProportionList, "insert", targetPanelIndex, newPanelPosition);
            updatedWorkspaceProps.panelDivisionReference[parentPanelID] = updatedParentDivision;

            // set parentPanelID for newPage
            updatedWorkspaceProps.pageDataReference[newPageID].parentPanelID = newSubPanelID;
        }
        return [updatedWorkspaceProps, newPageID];
    }

    export function closePageInPanel(workspaceProps: WorkspaceProps, workspaceUtility: WorkspaceUtility, config: WorkspaceConfig, panelID: PanelID, pageID: PageID): WorkspaceProps {
        // if the page is locked, show alert and return
        if (workspaceProps.pageDataReference[pageID].locked) {
            workspaceUtility.modalInterfaceRef.current!.showModalWithData!({ innerComponent: <CloseLockedPageAlert dismissCallback={workspaceUtility.modalInterfaceRef.current!.hideModal!} closedPageData={workspaceProps.pageDataReference[pageID]} /> });
            return workspaceProps;
        }
        // if page is not the only page in panel, just need to delete the page
        const updatedWorkspaceProps = createWorkspacePropsCopy(workspaceProps);
        if (workspaceProps.panelPageListReference[panelID].length > 1) {
            // delete page data
            delete updatedWorkspaceProps.pageDataReference[pageID];

            // remove page from panelpagelist
            const updatedPageList = updatedWorkspaceProps.panelPageListReference[panelID].filter((pID) => pID != pageID);
            updatedWorkspaceProps.panelPageListReference[panelID] = updatedPageList;

            // if panel is focused on the closed page, set panel focus to the most recently focused page
            if (updatedWorkspaceProps.panelFocusReference[panelID] == pageID) {
                updatedWorkspaceProps.panelFocusReference[panelID] = getMostRecentFocusedPageInPanel(updatedPageList, updatedWorkspaceProps.pageDataReference);
            }

            return updatedWorkspaceProps;
        }

        // if the page is the only page in panel, need to delete the panel
        // find parent panelID
        const parentPanelID = getParentPanelID(panelID, updatedWorkspaceProps.panelDivisionReference);

        // if this panel has parent, then this panel is a sub panel, we can delete this panel
        if (parentPanelID) return destroySubPanel(updatedWorkspaceProps, config, parentPanelID!, panelID, "delete");

        // if this panel does not have a parent, then this panel is the top panel and this tab is the only tab in workspace, replace this tab with default tab; if already default tab, do nothing
        const closePageData = updatedWorkspaceProps.pageDataReference[pageID];
        const defaultPage = DefaultPage; // for future default page override
        if (closePageData.renderData.type == "selfManaged" && closePageData.renderData.componentInstance!.type == defaultPage) {
            // show alert that the last tab cannot be closed
            workspaceUtility.modalInterfaceRef.current!.showModalWithData!({ innerComponent: <CloseDefaultPageAlert dismissCallback={workspaceUtility.modalInterfaceRef.current!.hideModal!} /> });
        } else {
            const newPageID = getSafeRandomID(updatedWorkspaceProps.workspaceID, "page", updatedWorkspaceProps);
            const newPageData = getNewDefaultPageData(newPageID, panelID);
            updatedWorkspaceProps.pageDataReference[newPageID] = newPageData;
            updatedWorkspaceProps.panelPageListReference[panelID] = [newPageID];
            updatedWorkspaceProps.panelFocusReference[panelID] = newPageID;
            delete updatedWorkspaceProps.pageDataReference[pageID];
        }
        return updatedWorkspaceProps;
    }

    export function closeOtherPagesInPanel(workspaceProps: WorkspaceProps, panelID: PanelID, initiatePageID: PageID, direction: "left" | "right" | "both"): WorkspaceProps {
        if (workspaceProps.panelPageListReference[panelID].length == 1) return workspaceProps; // if only one page in panel, do nothing

        const updatedWorkspaceProps = createWorkspacePropsCopy(workspaceProps);

        // update panel page list and delete closed page data
        const pageList = updatedWorkspaceProps.panelPageListReference[panelID];
        const updatedPageList = [];
        let currentSide = "left";
        for (const pageID of pageList) {
            if (updatedWorkspaceProps.pageDataReference[pageID].locked) updatedPageList.push(pageID); // if page is locked, keep it
            else if (pageID == initiatePageID) {
                updatedPageList.push(pageID);
                currentSide = "right";
            }
            else {
                if (direction == "both") {
                    delete updatedWorkspaceProps.pageDataReference[pageID];
                }
                else if (direction == currentSide) {
                    delete updatedWorkspaceProps.pageDataReference[pageID];
                }
                else if (direction != currentSide) {
                    updatedPageList.push(pageID);
                }
            }
        }
        updatedWorkspaceProps.panelPageListReference[panelID] = updatedPageList;

        // focus on the initiate page
        updatedWorkspaceProps.panelFocusReference[panelID] = initiatePageID;

        return updatedWorkspaceProps;
    }

    export function focusPageInPanel(workspaceProps: WorkspaceProps, panelID: PanelID, pageID: PageID): WorkspaceProps {
        // if panel is already focused on page tab, return
        if (workspaceProps.panelFocusReference[panelID] == pageID) return workspaceProps;

        // update panel focus ref
        const updatedPanelFocusReference = { ...workspaceProps.panelFocusReference, [panelID]: pageID };

        // return updated props
        return { ...workspaceProps, panelFocusReference: updatedPanelFocusReference };
    }

    export function movePage(workspaceProps: WorkspaceProps, workspaceUtility: WorkspaceUtility, config: WorkspaceConfig, orgPanelID: PanelID, targetPanelID: PanelID, pageID: PageID, targetPositionPageID?: PageID, forced?: boolean): WorkspaceProps {
        // similar logic to createNewDivision with movedPage, but without the need to create new division
        // 1. if orgPanel is the targetPanel, just need to update the panel page list
        // 2. destroy the original panel if it is the only page in panel
        // 3. detach the page from the original panel, update original panel page list and focus if not destroyed
        // 4. attach the page to the target panel

        // note that the target panel may be destroyed if it is the only sibling of the original panel and the original panel is destroyed; in this case, the parent panel of the target panel will become the target panel
        // this case is handled by destroySubPanel

        // moved page will take the position of the target page
        // if the target page is on the right, pages before and including the target page will be on the left of the moved page (the target page will be shifted to the left)
        // if the target page is on the left, pages after and including the target page will be on the right of the moved page (the target page will be shifted to the right)

        // after page move, the resulting page list should respect the ordering rule (locked pages before unlocked pages)
        // if the resulting page list violates the ordering rule, show modal and revert changes
        // set the forced flag to true will allow the move operation and the operation will "try" to move the page to the desired location, but the resulting page list will still be changed to respect the ordering rule (the move page may not be at the target position)

        // handle in-panel move
        if (orgPanelID == targetPanelID) {
            // just need to change panelpagelist
            const updatedPanelPageList = getPanelPageListAfterMove(workspaceProps.panelPageListReference[orgPanelID], pageID, targetPositionPageID);

            // check if the resulting panel page list respect the ordering rule (locked pages before unlocked pages)
            const isOrderValid = isPageListOrderValid(updatedPanelPageList, workspaceProps.pageDataReference);
            if (!forced && !isOrderValid) {
                // if the resulting list violates the ordering rule, show modal and return
                workspaceUtility.modalInterfaceRef.current!.showModalWithData!({ innerComponent: <MovePageAlert dismissCallback={workspaceUtility.modalInterfaceRef.current!.hideModal!} movedPageData={workspaceProps.pageDataReference[pageID]} /> });
                return workspaceProps;
            }
            // either the move is forced or the resulting list is valid
            const correctedPanelPageList = getOrderedPanelPageList(updatedPanelPageList, workspaceProps.pageDataReference);

            // focus on the moved page
            const updatedPanelFocusReference = { ...workspaceProps.panelFocusReference, [orgPanelID]: pageID };
            // return updated props
            return { ...workspaceProps, panelPageListReference: { ...workspaceProps.panelPageListReference, [orgPanelID]: correctedPanelPageList }, panelFocusReference: updatedPanelFocusReference };
        }

        // out-of-panel move
        // if page is locked, out-of-panel move is not allowed, show modal and return
        // bypass if forced
        if (!forced && workspaceProps.pageDataReference[pageID].locked) {
            workspaceUtility.modalInterfaceRef.current!.showModalWithData!({ innerComponent: <MoveLockedPageOutPanelAlert dismissCallback={workspaceUtility.modalInterfaceRef.current!.hideModal!} movedPageData={workspaceProps.pageDataReference[pageID]} /> });
            return workspaceProps;
        }
        // get copy of workspaceProps
        const updatedWorkspaceProps = createWorkspacePropsCopy(workspaceProps);

        // if the original panel only has one page, it will be destroyed after the page is moved
        if (workspaceProps.panelPageListReference[orgPanelID].length == 1) {
            const destroyedPanelParent = getParentPanelID(orgPanelID, workspaceProps.panelDivisionReference)!; // it is garanteed that orgPanel is not top Panel, therefore its parent panel exists
            const updatedWorkspaceProps = destroySubPanel(workspaceProps, config, destroyedPanelParent, orgPanelID, "move", targetPanelID);
            // after panel destruction, moved Page's position may not be correct, need to update it
            // moved page will be the last page in the target panel
            // target Panel may also be destroyed, we update targetPanelID
            targetPanelID = updatedWorkspaceProps.pageDataReference[pageID].parentPanelID;
            // now, this is an in-panel move
            const updatedWorkspacePropsAfterPositionFix = movePage(updatedWorkspaceProps, workspaceUtility, config, targetPanelID, targetPanelID, pageID, targetPositionPageID, forced);

            // if updatedWorkspacePropsAfterPositionFix is the same as updatedWorkspaceProps, it means the move is invalid due to violation of ordering rule
            // if forced, the workspace props will be updated
            if (updatedWorkspacePropsAfterPositionFix == updatedWorkspaceProps) {
                // show modal and return
                workspaceUtility.modalInterfaceRef.current!.showModalWithData!({ innerComponent: <MovePageAlert dismissCallback={workspaceUtility.modalInterfaceRef.current!.hideModal!} movedPageData={workspaceProps.pageDataReference[pageID]} /> });
                return workspaceProps;
            }


            return updatedWorkspacePropsAfterPositionFix;
        }

        // if the original panel has more than one page, just need to move the page
        // detach the page from the original panel
        // update original panel page list 
        const updatedPageList = updatedWorkspaceProps.panelPageListReference[orgPanelID].filter((pID) => pID != pageID);
        updatedWorkspaceProps.panelPageListReference[orgPanelID] = updatedPageList;

        // if orgpanel is focused on the moved page, set orgpanel to focus on the most recently focused page

        if (updatedWorkspaceProps.panelFocusReference[orgPanelID] == pageID) {
            updatedWorkspaceProps.panelFocusReference[orgPanelID] = getMostRecentFocusedPageInPanel(updatedPageList, updatedWorkspaceProps.pageDataReference);
        }


        // attach the page to the target panel
        // set parentpanelID for the moved page
        updatedWorkspaceProps.pageDataReference[pageID].parentPanelID = targetPanelID;
        // focus on the moved page
        updatedWorkspaceProps.panelFocusReference[targetPanelID] = pageID;
        // update target panel page list
        const targetPanelPageList = [...updatedWorkspaceProps.panelPageListReference[targetPanelID]];
        const targetPageIndex = targetPositionPageID ? targetPanelPageList.indexOf(targetPositionPageID) : targetPanelPageList.length;
        targetPanelPageList.splice(targetPageIndex, 0, pageID);
        updatedWorkspaceProps.panelPageListReference[targetPanelID] = targetPanelPageList;

        // check if the move violates the ordering rule (locked pages before unlocked pages)
        const isOrderValid = isPageListOrderValid(targetPanelPageList, updatedWorkspaceProps.pageDataReference);
        if (!forced && !isOrderValid) {
            // if the resulting list violates the ordering rule, show modal and return
            workspaceUtility.modalInterfaceRef.current!.showModalWithData!({ innerComponent: <MovePageAlert dismissCallback={workspaceUtility.modalInterfaceRef.current!.hideModal!} movedPageData={workspaceProps.pageDataReference[pageID]} /> });
            return workspaceProps;
        }
        // either the move is forced or the resulting list is valid
        const correctedPanelPageList = getOrderedPanelPageList(targetPanelPageList, updatedWorkspaceProps.pageDataReference);
        updatedWorkspaceProps.panelPageListReference[targetPanelID] = correctedPanelPageList;

        // return updated props
        return updatedWorkspaceProps;
    }

    export function destroySubPanel(workspaceProps: WorkspaceProps, config: WorkspaceConfig, parentPanelID: PanelID, subpanelID: PanelID, panelPageAction: "delete" | "move" | "ignore", pageMoveTargetPanelID?: PanelID): WorkspaceProps {
        const parentPanelDivision = workspaceProps.panelDivisionReference[parentPanelID];

        const updatedPanelPageListReference = { ...workspaceProps.panelPageListReference };
        const updatedPageDataReference = { ...workspaceProps.pageDataReference };
        const updatedPanelDivisionReference = { ...workspaceProps.panelDivisionReference };
        const updatedPanelFocusReference = { ...workspaceProps.panelFocusReference };
        const updatedPanelPositionReference = { ...workspaceProps.panelPositionReference };

        const childrenPanelPageList = getAllPageListUnderPanel(subpanelID, updatedPanelPageListReference, updatedPanelDivisionReference);

        // delete panelpagelist for subpanel
        delete updatedPanelPageListReference[subpanelID];

        // delete positionRef for subpanel
        delete updatedPanelPositionReference[subpanelID];

        // delete focus for subpanel
        delete updatedPanelFocusReference[subpanelID];

        // handle page list for subpanel, handle page data
        if (panelPageAction == "delete") {
            // need to delete all pages inside panel
            // delete pageData
            for (const pageID of childrenPanelPageList) {
                delete updatedPageDataReference[pageID];
            }
        }
        else if (panelPageAction == "move") {
            // need to move pages in the destroyed panel to pageMoveTargetPanel
            // change parentPanelID for all moved pages
            for (const pageID of childrenPanelPageList) {
                updatedPageDataReference[pageID] = { ...updatedPageDataReference[pageID], parentPanelID: pageMoveTargetPanelID! };
            }

            // update pageList for pageMoveTargetPanel, add moved pages to the end, then fix the page order (locked pages before unlocked pages)
            const newParentPageList = [...updatedPanelPageListReference[pageMoveTargetPanelID!], ...childrenPanelPageList];
            const orderedNewParentPageList = getOrderedPanelPageList(newParentPageList, updatedPageDataReference);
            updatedPanelPageListReference[pageMoveTargetPanelID!] = orderedNewParentPageList;
        }

        // if subpanel is not an end panel, need to delete all panels under subpanel
        const childrenPanelIDList = getAllSubpanelIDsUnderPanel(subpanelID, updatedPanelDivisionReference);

        // delete division state for subpanel
        delete updatedPanelDivisionReference[subpanelID];

        for (const panelID of childrenPanelIDList) {
            // delete panelpagelist for subpanel
            delete updatedPanelPageListReference[panelID];

            // delete focus for subpanel
            delete updatedPanelFocusReference[panelID];

            // delete division state for subpanel
            delete updatedPanelDivisionReference[panelID];

            // delete positionRef for subpanel
            delete updatedPanelPositionReference[panelID];
        }

        if (parentPanelDivision.subPanelIDList.length > 2) {
            // parent panel has more than 2 sub-panels, only need to delete the subpanel
            // update parent panel division
            const subpanelIndex = updatedPanelDivisionReference[parentPanelID].subPanelIDList.indexOf(subpanelID);
            // remove subpanel from subpanelIDList
            const updatedsubPanelIDList = [...updatedPanelDivisionReference[parentPanelID].subPanelIDList];
            updatedsubPanelIDList.splice(subpanelIndex, 1);
            // recalculate new proportions
            let updatedDivisionProportionList = getTrueProportionList(updatedPanelDivisionReference[parentPanelID], config.panelResizeHandleSizeRem);
            updatedDivisionProportionList = recalcualteDivisionProportion(updatedDivisionProportionList, "delete", subpanelIndex);
            updatedPanelDivisionReference[parentPanelID] = {
                ...updatedPanelDivisionReference[parentPanelID],
                divisionProportionList: updatedDivisionProportionList,
                subPanelIDList: updatedsubPanelIDList
            };

            // construct new workspace prop and return
            return {
                ...workspaceProps,
                panelDivisionReference: updatedPanelDivisionReference,
                panelPageListReference: updatedPanelPageListReference,
                panelFocusReference: updatedPanelFocusReference,
                pageDataReference: updatedPageDataReference,
                panelPositionReference: updatedPanelPositionReference,
            } as WorkspaceProps;
        }
        else if (parentPanelDivision.subPanelIDList.length == 2) {
            // parent panel has 2 subpanels, need to collapse parent panel into a level-0 panel

            // update parent division with the division of the other sibling panel
            const siblingPanelID = parentPanelDivision.subPanelIDList[0] == subpanelID ? parentPanelDivision.subPanelIDList[1] : parentPanelDivision.subPanelIDList[0];
            const updatedParentDivision = {
                ...updatedPanelDivisionReference[siblingPanelID],
                panelID: parentPanelID,
            }
            updatedPanelDivisionReference[parentPanelID] = updatedParentDivision;
            // delete division for subpanel and sibling panel
            delete updatedPanelDivisionReference[siblingPanelID];

            // if sibling panel is an end panel, move all pages from sibling to parent, delete sibling panel page list, update parent focus to sibling focus
            if (siblingPanelID in updatedPanelPageListReference) {
                updatedPanelPageListReference[parentPanelID] = [...updatedPanelPageListReference[siblingPanelID]];
                // update parent panelID for all moved pages
                for (const pageID of updatedPanelPageListReference[siblingPanelID]) {
                    updatedPageDataReference[pageID] = { ...updatedPageDataReference[pageID], parentPanelID: parentPanelID };
                }
                delete updatedPanelPageListReference[siblingPanelID];
                updatedPanelFocusReference[parentPanelID] = updatedPanelFocusReference[siblingPanelID];
            }

            // delete positionRef for sibling panel
            delete updatedPanelPositionReference[siblingPanelID];

            // delete focus for sibling panel
            delete updatedPanelFocusReference[siblingPanelID];


            // construct new workspace prop and return
            return {
                ...workspaceProps,
                panelDivisionReference: updatedPanelDivisionReference,
                panelPageListReference: updatedPanelPageListReference,
                panelFocusReference: updatedPanelFocusReference,
                pageDataReference: updatedPageDataReference,
                panelPositionReference: updatedPanelPositionReference,
            } as WorkspaceProps;
        }
        else {
            // this should not be reached! 
            console.warn(`Calling function "destroySubPanel" on panel "${parentPanelID}", which has ${parentPanelDivision.subPanelIDList.length} subpanels`);
            return workspaceProps;
        }
    }

    export function resizePanelDivision(workspaceProps: WorkspaceProps, panelID: PanelID, handleIndex: number, resizeStartProportionList: number[], percentageDelta: number, deltaRange: number[]): WorkspaceProps {
        // resize the panel division
        const updatedPanelDivisionReference = { ...workspaceProps.panelDivisionReference };
        const updatedProportion = [...resizeStartProportionList];

        // bound the percentageDelta to the min and max delta
        let boundedPercentageDelta = percentageDelta;
        if (percentageDelta <= deltaRange[0]) boundedPercentageDelta = deltaRange[0];
        else if (percentageDelta >= deltaRange[1]) boundedPercentageDelta = deltaRange[1];

        updatedProportion[handleIndex] = resizeStartProportionList[handleIndex] + boundedPercentageDelta;
        updatedProportion[handleIndex + 1] = resizeStartProportionList[handleIndex + 1] - boundedPercentageDelta;

        updatedPanelDivisionReference[panelID] = {
            ...updatedPanelDivisionReference[panelID],
            divisionProportionList: updatedProportion
        }

        return {
            ...workspaceProps,
            panelDivisionReference: updatedPanelDivisionReference
        } as WorkspaceProps;
    }

    export function togglePageLock(workspaceProps: WorkspaceProps, pageID: PageID): WorkspaceProps {
        const updatedPageDataReference = { ...workspaceProps.pageDataReference };
        const updatedPanelPageListReference = { ...workspaceProps.panelPageListReference };

        const newLockState = updatedPageDataReference[pageID].locked ? false : true;
        // toggle the lock status of the page
        updatedPageDataReference[pageID] = {
            ...updatedPageDataReference[pageID],
            locked: newLockState
        }

        // get the correct page order after the lock state is changed
        const panelID = updatedPageDataReference[pageID].parentPanelID;
        const pageList = updatedPanelPageListReference[panelID];
        const updatedPanelPageList = getOrderedPanelPageList(pageList, updatedPageDataReference);
        updatedPanelPageListReference[panelID] = updatedPanelPageList;

        // focus on the page
        const updatedPanelFocusReference = { ...workspaceProps.panelFocusReference, [panelID]: pageID };

        return {
            ...workspaceProps,
            pageDataReference: updatedPageDataReference,
            panelPageListReference: updatedPanelPageListReference,
            panelFocusReference: updatedPanelFocusReference
        } as WorkspaceProps;
    }

    export function updatePageData(workspaceProps: WorkspaceProps, pageID: PageID, updatedPageData: MutablePageData): WorkspaceProps {
        const updatedPageDataReference = { ...workspaceProps.pageDataReference };
        updatedPageDataReference[pageID] = { ...updatedPageDataReference[pageID], ...updatedPageData };
        return { ...workspaceProps, pageDataReference: updatedPageDataReference };
    }

    export function dispatchWorkspacePropsUpdate(orgWorkspaceProps: WorkspaceProps, updatedWorkspaceProps: WorkspaceProps, workspaceUtility: WorkspaceUtility, resizeObserver: ResizeObserver): void {
        // ResizeObserver refresh:
        // when panelDivision changes, some panels may be destroyed; PanelPageContainer cannot tell the resize observe to unoberse before the panel is destroyed; thus, we need to handle unobserving the destroyed panel here, before new states are dispatched
        if (orgWorkspaceProps.panelDivisionReference != updatedWorkspaceProps.panelDivisionReference) {
            const orgDivisionReference = orgWorkspaceProps.panelDivisionReference;
            const updatedDivisionReference = updatedWorkspaceProps.panelDivisionReference;
            for (const panelID in orgWorkspaceProps.panelDivisionReference) {
                const wasEndPanel = orgDivisionReference[panelID].subPanelIDList.length == 0;
                if ((wasEndPanel && !(panelID in updatedDivisionReference)) || (wasEndPanel && updatedDivisionReference[panelID].subPanelIDList.length != 0)) {
                    // this panel was an end panel, but will be destroyed or changed to a non-end panel
                    // unobserve the panel page container
                    resizeObserver.unobserve(document.getElementById(panelID + "-pageContainer")!);
                }
            }
        }

        // Update workspace props if changed
        if (orgWorkspaceProps.panelFocusReference != updatedWorkspaceProps.panelFocusReference) {
            workspaceUtility.setPanelFocusReference(updatedWorkspaceProps.panelFocusReference);
            // if panel focus is changed, need to update the last focsued timestamp for the page
            const updatedPageDataReference = { ...updatedWorkspaceProps.pageDataReference };
            for (const panelID in updatedWorkspaceProps.panelFocusReference) {
                // if a panel is new or the panel is old but the focus is changed, update the lastFocusedTimestamp for the focused page
                if (!(panelID in orgWorkspaceProps.panelFocusReference) || (panelID in orgWorkspaceProps.panelFocusReference && orgWorkspaceProps.panelFocusReference[panelID] != updatedWorkspaceProps.panelFocusReference[panelID])) {
                    const newFocusPageID = updatedWorkspaceProps.panelFocusReference[panelID];
                    updatedPageDataReference[newFocusPageID] = { ...updatedPageDataReference[newFocusPageID], lastFocusedTimestamp: Date.now() };
                }
            }
            updatedWorkspaceProps.pageDataReference = updatedPageDataReference;
        }
        if (orgWorkspaceProps.pageDataReference != updatedWorkspaceProps.pageDataReference) workspaceUtility.setPageDataReference(updatedWorkspaceProps.pageDataReference);
        if (orgWorkspaceProps.panelDivisionReference != updatedWorkspaceProps.panelDivisionReference) workspaceUtility.setPanelDivisionReference(updatedWorkspaceProps.panelDivisionReference);
        if (orgWorkspaceProps.panelPageListReference != updatedWorkspaceProps.panelPageListReference) workspaceUtility.setPanelPageListReference(updatedWorkspaceProps.panelPageListReference);
        if (orgWorkspaceProps.panelPositionReference != updatedWorkspaceProps.panelPositionReference) workspaceUtility.setPanelPositionReference(updatedWorkspaceProps.panelPositionReference);
    }
}
export default WorkspaceActionHandler;