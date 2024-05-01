import { WorkspacePropsContext } from "../WorkspaceContainer";
import { PageID, ElementRect, DraggedData } from "../types/workspaceTypes";
import { faFile } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useEffect, useRef, useState } from "react";
import { isPositionInElement } from "../functions/utility";

export default function DragIcon({draggedData, rootElementRef}:{draggedData: DraggedData|null, rootElementRef: React.RefObject<HTMLDivElement>}){
    const panelGlobalProps = useContext(WorkspacePropsContext);
    const [mousePosition, setMousePosition] = useState({x:0, y:0});
    const rootElementRectRef = useRef<ElementRect>({ x: 0, y: 0, width: 0, height: 0});
    const [draggedTabDimension, setDraggedTabDimension] = useState<ElementRect>({ x: 0, y: 0, width: 0, height: 0});
    const [dragCenterOffset, setDragCenterOffset] = useState({x:0, y:0});
    const [currentDraggedTab, setCurrentDraggedTab] = useState<PageID|null>(null); // used to block render when the position is not updated
    useEffect(() => {
        // if something is dragged, add mousemove event listener to update the drag icon position
        if (draggedData) {
            rootElementRectRef.current = rootElementRef.current!.getBoundingClientRect();
            const newDraggedTabDimension = document.getElementById(`${draggedData.pageID}-pageTab`)!.getBoundingClientRect();
            setDraggedTabDimension(newDraggedTabDimension);
            if (draggedData.type=="pageListItem"){
                const xOffset = newDraggedTabDimension.width * draggedData.startPositionRelative.leftProportion;
                const yOffset = newDraggedTabDimension.height * draggedData.startPositionRelative.topProportion;
                const newDragCenterOffset = {x: xOffset, y: yOffset};
                setDragCenterOffset(newDragCenterOffset);
            }
            else if (draggedData.type=="tab"){
                // if startPosition is in element, calculate correct offset
                if (isPositionInElement(draggedData.startPosition, newDraggedTabDimension)){
                    const newDragCenterOffset = {x: draggedData.startPosition.x - newDraggedTabDimension.x, y: draggedData.startPosition.y - newDraggedTabDimension.y};
                    setDragCenterOffset(newDragCenterOffset);
                }
                // else, startPosition is not in element, can only be from click move, use center
                else{
                    const newDragCenterOffset = {x: newDraggedTabDimension.width/2, y: newDraggedTabDimension.height/2};
                    setDragCenterOffset(newDragCenterOffset);
                }
            }

            const dragHandler = (e: MouseEvent) => {
                setMousePosition({ x: e.x-rootElementRectRef.current.x, y: e.y-rootElementRectRef.current.y});
                if (currentDraggedTab!=draggedData.pageID){
                    setCurrentDraggedTab(draggedData.pageID);
                }
            }
            window.addEventListener("mousemove", dragHandler);

            // handle the initial mouse position
            dragHandler({x: draggedData.startPosition.x, y: draggedData.startPosition.y} as MouseEvent);

            return () => {
                window.removeEventListener("mousemove", dragHandler);
            };
        }

    }, [draggedData]);
    let iconId = draggedData ? panelGlobalProps!.pageDataReference[draggedData.pageID].icon :faFile;
    let icon = <FontAwesomeIcon className='' icon={iconId?iconId:faFile} />;
    let name = draggedData ? panelGlobalProps!.pageDataReference[draggedData.pageID].name :"";
    return (
        <div className={`px-2 rounded flex-row absolute bg-foreground-high-2 text-background-low-2 shadow z-50 overflow-hidden opacity-70 ${(draggedData && draggedData?.pageID==currentDraggedTab) ? "flex" : "hidden"}`} style={{top:mousePosition.y-dragCenterOffset.y, left:mousePosition.x-dragCenterOffset.x, width: draggedTabDimension.width, height: draggedTabDimension.height }} onMouseDown={(e)=>{e.preventDefault()}}>
            <span className="my-auto">{icon}</span>
            <span className="my-auto pl-2 whitespace-nowrap mr-auto overflow-hidden text-ellipsis">{name}</span>
        </div>
    )
}
