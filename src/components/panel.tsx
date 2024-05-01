import { useContext, useRef } from "react";
import { PanelID } from "../types/workspaceTypes";
import { WorkspacePropsContext, WorkspaceConfigContext } from "../WorkspaceContainer";
import { PanelTopBar } from "./panelTopBar";
import { PanelPageContainer } from "./panelPageContainer";
import { PanelResizeHandle } from "./panelResizeHandle";
import { getMaxSubPanelCount } from "../functions/utility";

interface PanelProps {
    panelID: PanelID,
    dimensionProportion: number
}

export function Panel({ panelID, dimensionProportion }: PanelProps) {
    const workspaceProps = useContext(WorkspacePropsContext);
    const workspaceConfig = useContext(WorkspaceConfigContext);

    const selfRef = useRef<HTMLDivElement>(null);
    const panelDivision = workspaceProps!.panelDivisionReference[panelID];
    const panelFlex = { flexBasis: 0, flexGrow: dimensionProportion, flexShrink: dimensionProportion };
    
    if (panelDivision.subPanelIDList.length == 0) {
        // no sub panels, this is an end panel
        // render PanelTabBar and PanelPageSpace
        return (
            <div ref={selfRef} id={panelID} className="flex flex-col relative bg-background" style={{ ...panelFlex, minHeight: `${workspaceConfig!.panelMinimumDimensionRem.height}rem`, minWidth: `${workspaceConfig!.panelMinimumDimensionRem.width}rem` }}>
                <PanelTopBar panelID={panelID} />
                <PanelPageContainer panelID={panelID} />
            </div>
        );
    }
    else {
        // has sub panels, render subpanels
        const maxSubPanelCounts = {
            horizontal: getMaxSubPanelCount(panelID, "horizontal", workspaceProps!.panelDivisionReference),
            vertical: getMaxSubPanelCount(panelID, "vertical", workspaceProps!.panelDivisionReference),
        }
        const minDim = {
            minHeight: `${maxSubPanelCounts.vertical*workspaceConfig!.panelMinimumDimensionRem.height + (maxSubPanelCounts.vertical-1)*workspaceConfig!.panelResizeHandleSizeRem}rem`,
            minWidth: `${maxSubPanelCounts.horizontal*workspaceConfig!.panelMinimumDimensionRem.width + (maxSubPanelCounts.horizontal-1)*workspaceConfig!.panelResizeHandleSizeRem}rem`
        }
        const subPanelJSXList = [];
        for (let idx = 0; idx < panelDivision.subPanelIDList.length; idx++) {
            subPanelJSXList.push(
                <Panel panelID={panelDivision.subPanelIDList[idx]} dimensionProportion={panelDivision.divisionProportionList[idx]} key={panelDivision.subPanelIDList[idx]} />
            );
            if (idx != panelDivision.subPanelIDList.length - 1) {
                // if not last panel, add a resize handle
                subPanelJSXList.push(<PanelResizeHandle panelRef={selfRef} panelID={panelID} handleIndex={idx} key={`${panelID}-handle${idx}`} />);
            }
        }

        return (
            <div className={`flex relative min-w-0 min-h-0 ${panelDivision.divisionDirection == "horizontal" ? 'flex-row' : 'flex-col'}`} style={{...panelFlex, ...minDim}} ref={selfRef} id={panelID}>
                {subPanelJSXList}
            </div>
        );
    }
}
