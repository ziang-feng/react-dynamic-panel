import { useContext, useEffect, useRef, useState } from "react";
import { WorkspaceInterfaceContext } from "../WorkspaceContainer";
import { PageID } from "../types/workspaceTypes";
import { PageComponentIDContext, PanelDataExternal, WorkspaceInterface } from "../functions/workspaceExternalInterface";
import { faCalculator, faClock, faList, faMugHot, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Calculator from "./samplePageComponents/calculator";
import Timer from "./samplePageComponents/timer";
import TodoApp from "./samplePageComponents/todolist";

export default function DefaultPage() {
    const workspaceInterface = useContext(WorkspaceInterfaceContext)!;
    const pageID = useContext(PageComponentIDContext);

    const workspaceContainerRect = workspaceInterface.dataAccessor.workspaceContainerRef.current?.getBoundingClientRect();
    const selfPageData = workspaceInterface.dataAccessor.pageDataReference[pageID];
    const selfParentPanelData = workspaceInterface.dataAccessor.panelDataReference[selfPageData.parentPanelID] as PanelDataExternal & { type: "PagePanel" };
    const selfParentPanelPageContainerRect = selfParentPanelData.pageContainerBoundingBox;
    const panelID = selfPageData.parentPanelID;

    const positionIndicatorWorkspaceContainerStyle: React.CSSProperties = {}
    const positionIndicatorPanelContainerStyle: React.CSSProperties = {}
    if (workspaceContainerRect && selfParentPanelPageContainerRect) {
        const aspectRatio = workspaceContainerRect.width / workspaceContainerRect.height;
        positionIndicatorWorkspaceContainerStyle.aspectRatio = aspectRatio;
        positionIndicatorPanelContainerStyle.width = `${selfParentPanelPageContainerRect.width / workspaceContainerRect.width * 100}%`;
        positionIndicatorPanelContainerStyle.height = `${selfParentPanelPageContainerRect.height / workspaceContainerRect.height * 100}%`;
        positionIndicatorPanelContainerStyle.left = `${selfParentPanelPageContainerRect.x / workspaceContainerRect.width * 100}%`;
        positionIndicatorPanelContainerStyle.top = `${selfParentPanelPageContainerRect.y / workspaceContainerRect.height * 100}%`;

    }

    const [mountTimeStamp, setMountTimeStamp] = useState<number>(Date.now());
    const [currentTimeStamp, setCurrentTimeStamp] = useState<number>(Date.now());
    useEffect(() => {
        setMountTimeStamp(Date.now());
        setCurrentTimeStamp(Date.now());
        const interval = setInterval(() => {
            setCurrentTimeStamp(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const selfPageIndex = selfParentPanelData.pageIDList.indexOf(pageID);
    const prevPageID = selfPageIndex == 0 ? null : selfParentPanelData.pageIDList[selfPageIndex - 1];
    const nextPageID = selfPageIndex == selfParentPanelData.pageIDList.length - 1 ? null : selfParentPanelData.pageIDList[selfPageIndex + 1];
    const locked = selfPageData.locked;
    const persist = selfPageData.persist;

    let proportionActionTests: JSX.Element | undefined;
    const actionTestButtonClassName = "flex flex-row px-2 py-1 m-1 flex-shrink-0 overflow-x-hidden shadow rounded text-slate-800";
    if (selfParentPanelData.parentPanelID) {
        const panelParentPanelData = workspaceInterface.dataAccessor.panelDataReference[selfParentPanelData.parentPanelID] as PanelDataExternal & { type: "DivisionPanel" };
        const proportionList = panelParentPanelData.divisionProportionList;
        const selfParentPanelIndex = panelParentPanelData.subPanelIDList.indexOf(panelID);
        const beforePanelID = selfParentPanelIndex != 0 ? panelParentPanelData.subPanelIDList[selfParentPanelIndex - 1] : undefined;
        const afterPanelID = selfParentPanelIndex != panelParentPanelData.subPanelIDList.length - 1 ? panelParentPanelData.subPanelIDList[selfParentPanelIndex + 1] : undefined;

        proportionActionTests =
            <div className="flex flex-row text-sm flex-wrap *:bg-indigo-100 hover:*:bg-indigo-300">
                <button className={actionTestButtonClassName} onClick={() => {
                    const newProportionList = [...proportionList];
                    if (beforePanelID) {
                        newProportionList[selfParentPanelIndex - 1] -= 5;
                        newProportionList[selfParentPanelIndex] += 5;
                        workspaceInterface.externalAction.updatePanelDivisionProportion(panelParentPanelData.panelID, newProportionList);
                    }
                }}>proportion before-5 self+5</button>
                <button className={actionTestButtonClassName} onClick={() => {
                    const newProportionList = [...proportionList];
                    if (beforePanelID) {
                        newProportionList[selfParentPanelIndex - 1] += 5;
                        newProportionList[selfParentPanelIndex] -= 5;
                        workspaceInterface.externalAction.updatePanelDivisionProportion(panelParentPanelData.panelID, newProportionList);
                    }
                }}>proportion before+5 self-5</button>
                <button className={actionTestButtonClassName} onClick={() => {
                    const newProportionList = [...proportionList];
                    if (afterPanelID) {
                        newProportionList[selfParentPanelIndex + 1] += 5;
                        newProportionList[selfParentPanelIndex] -= 5;
                        workspaceInterface.externalAction.updatePanelDivisionProportion(panelParentPanelData.panelID, newProportionList);
                    }
                }}>proportion self-5 after+5</button>
                <button className={actionTestButtonClassName} onClick={() => {
                    const newProportionList = [...proportionList];
                    if (afterPanelID) {
                        newProportionList[selfParentPanelIndex + 1] -= 5;
                        newProportionList[selfParentPanelIndex] += 5;
                        workspaceInterface.externalAction.updatePanelDivisionProportion(panelParentPanelData.panelID, newProportionList);
                    }
                }}>proportion self+5 after-5</button>
            </div>
    }

    const [newName, setNewName] = useState<string>("page name here");

    return (
        <div className="flex flex-col w-full h-full overflow-auto p-5">
            <h1 className="font-bold">Default Page Example ({pageID})</h1>
            <hr className="mb-3"></hr>
            <h1 className="font-semibold mb-1">Action Tests:</h1>
            <div className="flex flex-row text-sm flex-wrap *:bg-sky-100 hover:*:bg-sky-300">
                <button className={actionTestButtonClassName} onClick={() => { prevPageID && workspaceInterface.externalAction.movePage(panelID, panelID, pageID, prevPageID) }}>Move Page Left</button>
                <button className={actionTestButtonClassName} onClick={() => { nextPageID && workspaceInterface.externalAction.movePage(panelID, panelID, pageID, nextPageID) }}>Move Page Right</button>
            </div>
            <div className="flex flex-row text-sm flex-wrap *:bg-cyan-100 hover:*:bg-cyan-300">
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.externalAction.updatePageData(pageID, { name: newName }) }}>
                    Change name to
                    <input className="border border-slate-300 rounded px-1 mx-1" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onClickCapture={(e) => { e.stopPropagation() }}></input>
                </button>
                <button className={actionTestButtonClassName} onClick={() => {
                    if (selfPageData.customContextMenuItems) {
                        workspaceInterface.externalAction.updatePageData(pageID, { customContextMenuItems: undefined })
                    } else {
                        workspaceInterface.externalAction.updatePageData(pageID, {
                            customContextMenuItems: [
                                { label: "Log page data", action: (workspaceInterface: WorkspaceInterface, pageID: PageID) => { console.log(workspaceInterface.dataAccessor.pageDataReference[pageID]) }, key: "log name", disabled: false },
                                {
                                    label: "Show page data modal", action: (workspaceInterface: WorkspaceInterface, pageID: PageID) => {
                                        workspaceInterface.modalInterfaceRef.current!.showModalWithData({ innerComponent: <div className="p-5 whitespace-pre-wrap">{JSON.stringify(workspaceInterface.dataAccessor.pageDataReference[pageID], null, 4)}</div> })
                                    }, key: "show modal with page data", disabled: false
                                },
                                { label: "This option is disabled", action: (_workspaceInterface: WorkspaceInterface, _pageID: PageID) => { }, key: "disabled", disabled: true },
                                { label: "Set custom icon", icon: faMugHot, action: (workspaceInterface: WorkspaceInterface, pageID: PageID) => { workspaceInterface.externalAction.updatePageData(pageID, { icon: faMugHot }) }, key: "icon", disabled: false, },
                            ]
                        })
                    }
                }}>{selfPageData.customContextMenuItems ? "Remove custom context menu items" : "Add custom context menu items"}</button>
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.externalAction.updatePageData(pageID, { icon: selfPageData.icon ? undefined : faStar }) }}>{selfPageData.icon ? "Remove" : "Set"} custom icon {selfPageData.icon ? "" : <FontAwesomeIcon icon={faStar} className="my-auto h-3 w-3"></FontAwesomeIcon>}</button>
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.modalInterfaceRef.current!.showModalWithData({ innerComponent: <div className="p-5 whitespace-pre-wrap">{JSON.stringify(workspaceInterface.dataAccessor.pageDataReference[pageID], null, 4)}</div> }) }}>Show modal with Page Data</button>

            </div>
            <div className="flex flex-row text-sm flex-wrap *:bg-cyan-100 hover:*:bg-cyan-300">
                <button className={actionTestButtonClassName} onClick={() => { locked ? workspaceInterface.externalAction.unlockPage(pageID) : workspaceInterface.externalAction.lockPage(pageID) }}>{locked ? "Unlock Page" : "Lock Page"}</button>
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.externalAction.updatePageData(pageID, { persist: persist ? false : true }) }}>{persist ? "Make page non-persist" : "Make page persist"} (will cause remount)</button>
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.externalAction.updatePageData(pageID, { confirmClose: selfPageData.confirmClose ? false : true }) }}>{selfPageData.confirmClose ? "Remove page close confirmation" : "Require page close confirmation"}</button>
            </div>
            <div className="flex flex-row text-sm flex-wrap *:bg-purple-100 hover:*:bg-purple-300">
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.externalAction.createNewDefaultPageInPanel(panelID, pageID) }}>Create New Default Page to the left</button>
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.externalAction.createNewDefaultPageInPanel(panelID, nextPageID ? nextPageID : undefined) }}>Create New Default Page to the right</button>
            </div>
            {proportionActionTests}
            <div className="flex flex-row text-sm flex-wrap *:bg-emerald-100 hover:*:bg-emerald-300">
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.externalAction.dividePagePanel(panelID, "horizontal", "before") }}>Create New Panel left</button>
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.externalAction.dividePagePanel(panelID, "horizontal", "after") }}>Create New Panel right</button>
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.externalAction.dividePagePanel(panelID, "vertical", "before") }}>Create New Panel above</button>
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.externalAction.dividePagePanel(panelID, "vertical", "after") }}>Create New Panel below</button>
            </div>
            <div className="flex flex-row text-sm flex-wrap *:bg-amber-100 hover:*:bg-amber-300">
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.externalAction.closePageInPanel(panelID, pageID) }}>Close Page</button>
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.externalAction.closeOtherPagesInPanel(panelID, pageID, "left") }}>Close Pages to the left</button>
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.externalAction.closeOtherPagesInPanel(panelID, pageID, "right") }}>Close Pages to the right</button>
                <button className={actionTestButtonClassName} onClick={() => { workspaceInterface.externalAction.closeOtherPagesInPanel(panelID, pageID, "both") }}>Close Other Pages in Panel</button>
            </div>
            <div className="flex flex-row text-sm flex-wrap *:bg-rose-100 hover:*:bg-rose-300">
                <button className={actionTestButtonClassName} disabled={selfParentPanelData.parentPanelID == undefined} onClick={() => { selfParentPanelData.parentPanelID && workspaceInterface.externalAction.destroySubPanel(selfParentPanelData.parentPanelID, panelID, "delete") }}>Destroy This Panel{`${selfParentPanelData.parentPanelID ? "" : " (disabled due to panel being the top panel)"}`}</button>
            </div>
            <h1 className="font-semibold mb-1 mt-3">Render sample page:</h1>
            <div className="flex flex-row text-sm flex-wrap *:bg-lime-100 hover:*:bg-lime-300">
                <button className={actionTestButtonClassName} onClick={() => {
                    const calculatorCount = Object.keys(workspaceInterface.dataAccessor.pageDataReference).filter((pageID) => workspaceInterface.dataAccessor.pageDataReference[pageID].name.includes("Calculator")).length;
                    workspaceInterface.externalAction.updatePageData(pageID, { name: `Calculator ${calculatorCount == 0 ? "" : calculatorCount}`, persist: false, icon: faCalculator, renderData: { type: 'selfManaged', componentInstance: <Calculator /> } })
                }}>Calculator</button>
                <button className={actionTestButtonClassName} onClick={() => {
                    const calculatorCount = Object.keys(workspaceInterface.dataAccessor.pageDataReference).filter((pageID) => workspaceInterface.dataAccessor.pageDataReference[pageID].name.includes("Calculator")).length;
                    workspaceInterface.externalAction.updatePageData(pageID, { name: `Calculator (Persistent) ${calculatorCount == 0 ? "" : calculatorCount}`, persist: true, icon: faCalculator, renderData: { type: 'selfManaged', componentInstance: <Calculator /> } })
                }}>Calculator (persistent)</button>
                <button className={actionTestButtonClassName} onClick={() => {
                    const timerCount = Object.keys(workspaceInterface.dataAccessor.pageDataReference).filter((pageID) => workspaceInterface.dataAccessor.pageDataReference[pageID].name.includes("Timer")).length;
                    workspaceInterface.externalAction.updatePageData(pageID, { name: `Timer ${timerCount == 0 ? "" : timerCount}`, persist: false, icon: faClock, renderData: { type: 'selfManaged', componentInstance: <Timer /> } })
                }}>Timer</button>
                <button className={actionTestButtonClassName} onClick={() => {
                    const timerCount = Object.keys(workspaceInterface.dataAccessor.pageDataReference).filter((pageID) => workspaceInterface.dataAccessor.pageDataReference[pageID].name.includes("Timer")).length;
                    workspaceInterface.externalAction.updatePageData(pageID, { name: `Timer (Persistent) ${timerCount == 0 ? "" : timerCount}`, persist: true, icon: faClock, renderData: { type: 'selfManaged', componentInstance: <Timer /> } })
                }}>Timer (persistent)</button>
                <button className={actionTestButtonClassName} onClick={() => {
                    const todoAppCount = Object.keys(workspaceInterface.dataAccessor.pageDataReference).filter((pageID) => workspaceInterface.dataAccessor.pageDataReference[pageID].name.includes("Todo")).length;
                    workspaceInterface.externalAction.updatePageData(pageID, { name: `Todo List ${todoAppCount == 0 ? "" : todoAppCount}`, persist: false, icon: faList, renderData: { type: 'selfManaged', componentInstance: <TodoApp /> } })
                }}>Todo List</button>
                <button className={actionTestButtonClassName} onClick={() => {
                    const todoAppCount = Object.keys(workspaceInterface.dataAccessor.pageDataReference).filter((pageID) => workspaceInterface.dataAccessor.pageDataReference[pageID].name.includes("Todo")).length;
                    workspaceInterface.externalAction.updatePageData(pageID, { name: `Todo List (Persistent) ${todoAppCount == 0 ? "" : todoAppCount}`, persist: true, icon: faList, renderData: { type: 'selfManaged', componentInstance: <TodoApp /> } })
                }}>Todo List (persistent)</button>
            </div>
            <h1 className="font-semibold mb-1 mt-3">Page Data:</h1>
            <div className="flex flex-col text-sm">
                <h2 className="">ID: {pageID}</h2>
                <h2 className="">Name: {selfPageData.name}</h2>
                <h2 className="">Parent Panel: {selfPageData.parentPanelID}</h2>
                <h2 className="">Persist: <span className={`${selfPageData.persist ? "text-green-500" : "text-rose-500"}`}>{selfPageData.persist ? "true" : "false"}</span></h2>
                <h2 className="">Locked: <span className={`${selfPageData.locked ? "text-green-500" : "text-rose-500"}`}>{selfPageData.locked ? "true" : "false"}</span></h2>
                <h2 className="">Confirm Close: <span className={`${selfPageData.confirmClose ? "text-green-500" : "text-rose-500"}`}>{selfPageData.confirmClose ? "true" : "false"}</span></h2>
                <h2 className="">Page Position in Panel: {selfParentPanelData.pageIDList!.indexOf(pageID)}</h2>
                <h2 className="">Parent Panel Proportion: {selfParentPanelData.selfProportion ? selfParentPanelData.selfProportion.toFixed(2) : 1}</h2>
            </div>
            <h1 className="font-semibold mb-1 mt-3">Page Time Data: (current {timestampToTimeString(currentTimeStamp)})</h1>
            <div className="flex flex-col text-sm">
                <h2 className="">Page Creation Time: {timestampToTimeString(selfPageData.creationTimestamp)} ({((currentTimeStamp - selfPageData.creationTimestamp) / 1000).toFixed(0)} s ago)</h2>
                <h2 className="">Last Focused Time: {timestampToTimeString(selfPageData.lastFocusedTimestamp)} ({((currentTimeStamp - selfPageData.lastFocusedTimestamp) / 1000).toFixed(0)} s ago)</h2>
                <h2 className="">Page Mount Time: {timestampToTimeString(mountTimeStamp)} ({((currentTimeStamp - mountTimeStamp) / 1000).toFixed(0)} s ago)</h2>
            </div>
            <h1 className="font-semibold mb-1 mt-3">Page Position Indicator:</h1>
            <div className="flex w-80 h-40 max-w-full max-h-40 flex-shrink-0">
                <div className="relative bg-sky-100 rounded flex border border-slate-300 max-w-full max-h-full" style={positionIndicatorWorkspaceContainerStyle}>
                    <div className="absolute bg-teal-200 rounded border border-slate-300" style={positionIndicatorPanelContainerStyle}></div>
                </div>
            </div>
        </div>
    )
}

function timestampToTimeString(timestamp: number) {
    const date = new Date(timestamp);
    return date.toTimeString().slice(0, 8);

}