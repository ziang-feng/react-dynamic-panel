import React, { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { ModalInterface, ModalData } from "../types/modalTypes";

export const Modal = forwardRef<ModalInterface, {}>((_props, ref) => {
    const [modalState, setModalState] = useState<"hidden" | "hiding" | "show">("hidden");
    const [modalData, setModalData] = useState<ModalData>({ innerComponent: null });
    const [modalDataTimestamp, setModalDataTimestamp] = useState(Date.now()); // used to force re-render when modalData changes
    const hideModalCallbackTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const backdropElementRef = useRef<HTMLDivElement>(null);

    function showModalWithData(modalData: ModalData) {
        if (hideModalCallbackTimeoutRef.current) clearTimeout(hideModalCallbackTimeoutRef.current);
        if (modalState!="show") setModalState("show");
        setModalData(modalData);
        setModalDataTimestamp(Date.now());
    }

    const hideModal = ()=>{
        setModalState((prev) => {
            if (prev == "show") {
                hideModalCallbackTimeoutRef.current = setTimeout(hideModalCallback, 175);
                return "hiding"
            }
            return prev
        });
    }

    useImperativeHandle(ref, () => {
        return {
            showModalWithData,
            hideModal
        };
    }, [showModalWithData, hideModal]);

    function hideModalCallback() {
        setModalState((prev) => prev == "hiding" ? "hidden" : prev);
        hideModalCallbackTimeoutRef.current = undefined;
    }

    function backdropClickHandler(e:React.MouseEvent<HTMLDivElement>) {
        if (e.target == backdropElementRef.current){
            if (!modalData.preventBackdropDismiss) hideModal();
        }
    }

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
        <div id="workspaceBackdrop" className={`absolute bg-backdrop left-0 right-0 top-0 bottom-0 p-10 h-full w-full ${backdropStyle!} ${modalData.infiniteHeight?"max-h-full overflow-auto":""} z-50`} onClick={backdropClickHandler} ref={backdropElementRef}>
            <div className={`shadow rounded-lg bg-background m-auto  ${modalStyle!} max-w-full ${modalData.infiniteHeight?"":"overflow-auto max-h-full"}`} key={modalDataTimestamp} >
                {modalData.innerComponent}
            </div>
        </div>
    )

})
