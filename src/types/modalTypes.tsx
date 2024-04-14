import { FC, ReactNode } from "react";

export interface ModalData { innerComponent: ReactNode | null, preventBackdropDismiss?: boolean, infiniteHeight?:boolean };

export interface ModalInterface {
    showModalWithData(modalData: ModalData): void,
    hideModal(): void
}