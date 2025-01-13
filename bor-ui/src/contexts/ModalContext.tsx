import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RechargeModalProps {
  initialAmount?: number;
  currency?: string;
}

interface ConfirmationModalProps {
  title?: string;
  message: string;
  onConfirm?: () => void;
}

interface ModalContextProps {
  showRechargeModal: boolean;
  showConfirmationModal: boolean;
  rechargeModalProps: RechargeModalProps | null;
  confirmationModalProps: ConfirmationModalProps | null;
  openRechargeModal: (props: RechargeModalProps) => void;
  closeRechargeModal: () => void;
  openConfirmationModal: (props: ConfirmationModalProps) => void;
  closeConfirmationModal: () => void;
}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [rechargeModalProps, setRechargeModalProps] = useState<RechargeModalProps | null>(null);
  const [confirmationModalProps, setConfirmationModalProps] = useState<ConfirmationModalProps | null>(null);

  const openRechargeModal = (props: RechargeModalProps) => {
    setRechargeModalProps(props);
    setShowRechargeModal(true);
  };

  const closeRechargeModal = () => {
    setShowRechargeModal(false);
    setRechargeModalProps(null);
  };

  const openConfirmationModal = (props: ConfirmationModalProps) => {
    setConfirmationModalProps(props);
    setShowConfirmationModal(true);
  };

  const closeConfirmationModal = () => {
    setShowConfirmationModal(false);
    setConfirmationModalProps(null);
  };


  return (
    <ModalContext.Provider
      value={{
        showRechargeModal,
        showConfirmationModal,
        rechargeModalProps,
        confirmationModalProps,
        openRechargeModal,
        closeRechargeModal,
        openConfirmationModal,
        closeConfirmationModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}; 