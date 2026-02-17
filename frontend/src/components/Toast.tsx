import React, { useState } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
        ? "bg-red-500"
        : type === "warning"
          ? "bg-yellow-500"
          : "bg-blue-500";

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-out z-50`}
    >
      {message}
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) => {
    setToast({ message, type });
  };

  return { toast, showToast, setToast };
};
