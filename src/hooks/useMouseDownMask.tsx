import { WorkspaceDragProps } from "../types/workspaceTypes";

export default function useMouseDownMask(document: Document, workspaceDragProps: WorkspaceDragProps) {
    // lock all panel page spaces when mouse down on certain element
    // release lock when mouse up
    // used when dragging page tabs or using the resize handle
    // return the mousedown event handler
    function mouseDownHandler() {
        document.addEventListener("mouseup", mouseUpHandler);
        workspaceDragProps.setWorkspaceMask("workspace");
    }
    function mouseUpHandler() {
        document.removeEventListener("mouseup", mouseUpHandler);
        workspaceDragProps.setWorkspaceMask(null);
    }
    return mouseDownHandler;
}
