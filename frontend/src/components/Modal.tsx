import React from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit?: () => void;
  submitText?: string;
  loading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  onClose,
  onSubmit,
  submitText = "Salvar",
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto">{children}</div>

        <div className="flex gap-3 p-6 border-t justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>
          {onSubmit && (
            <button
              onClick={onSubmit}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "Salvando..." : submitText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
