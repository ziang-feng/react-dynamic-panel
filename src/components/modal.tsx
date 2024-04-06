import { useState, forwardRef, useImperativeHandle } from "react";
import { ModalInterface, ModalData } from "../types/modalTypes";


export const Modal = forwardRef<ModalInterface, {}>((_props, ref) => {
    const [modalState, setModalState] = useState<"hidden" | "hiding" | "show">("hidden");
    const [modalData, setModalData] = useState<ModalData>({ component: null });

    useImperativeHandle(ref, () => {
        return {
            showModalWithData,
            hideModal
        };
    }, []);

    function showModalWithData(modalData: ModalData) {
        setModalState((prev) => prev == "hidden" ? "show" : prev);
        setModalData(modalData);
    }

    function hideModal() {
        setModalState((prev) => {
            if (modalState == "show") {
                setTimeout(hideModalCallback, 175);
                return "hiding"
            }
            return prev
        });
    }

    function hideModalCallback() {
        setModalState((prev) => prev == "hiding" ? "hidden" : prev);
    }

    const InsideComponent = modalData.component;

    let backdropStyle:string, modalStyle:string;

    if (modalState=="show"){
        backdropStyle = "flex fadeIn";
        modalStyle = "slideFromTop";
    }
    else if (modalState=="hiding"){
        backdropStyle = "flex fadeOut";
        modalStyle = "";
    }
    else if (modalState=="hidden"){
        backdropStyle = "hidden";
        modalStyle = "";
    }

    return (
        <div id="workspaceBackdrop" className={`absolute bg-backdrop left-0 right-0 top-0 bottom-0 ${backdropStyle!} z-50`} onClick={hideModal}>
            <div className={`w-72 h-72 shadow rounded bg-background m-auto ${modalStyle!}`} onClick={(e) => { e.stopPropagation() }}>
                {InsideComponent ? <InsideComponent {...modalData.props} /> : null}
            </div>
        </div>
    )

})