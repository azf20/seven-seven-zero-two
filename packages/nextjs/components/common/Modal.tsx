import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-blue-500 text-white p-4 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <div className="overflow-y-auto flex-1">{children}</div>
        <button onClick={onClose} className="mt-4 bg-gray-600 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
};
