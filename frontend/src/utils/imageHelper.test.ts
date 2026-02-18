import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { imageToBase64, isValidImageFile } from "./imageHelper.js";

class MockImage {
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;
  width = 3000;
  height = 2000;

  set src(_value: string) {
    setTimeout(() => {
      this.onload?.();
    }, 0);
  }
}

describe("imageHelper", () => {
  const originalCreateElement = document.createElement.bind(document);
  const originalImage = globalThis.Image;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    Object.defineProperty(globalThis, "Image", {
      value: MockImage,
      configurable: true,
    });

    URL.createObjectURL = vi.fn(() => "blob:mock");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    document.createElement = originalCreateElement;

    Object.defineProperty(globalThis, "Image", {
      value: originalImage,
      configurable: true,
    });

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it("accepts valid image types", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "foto.png", {
      type: "image/png",
    });

    expect(isValidImageFile(file)).toBe(true);
  });

  it("rejects invalid image types", () => {
    const file = new File(["texto"], "arquivo.txt", { type: "text/plain" });

    expect(() => isValidImageFile(file)).toThrow(
      "Apenas imagens (JPEG, PNG, GIF, WebP) são permitidas",
    );
  });

  it("keeps original conversion for files up to 5MB", async () => {
    const file = new File([new Uint8Array([1, 2, 3, 4])], "pequena.jpg", {
      type: "image/jpeg",
    });

    const result = await imageToBase64(file);

    expect(result.startsWith("data:image/jpeg;base64,")).toBe(true);
  });

  it("compresses files above 5MB to fit limit", async () => {
    const largeContent = new Uint8Array(5 * 1024 * 1024 + 5);
    const file = new File([largeContent], "grande.jpg", { type: "image/jpeg" });

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({
        fillStyle: "",
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        drawImage: vi.fn(),
      })),
      toBlob: vi.fn((callback: (blob: Blob | null) => void, type?: string) => {
        callback(
          new Blob([new Uint8Array(1024)], { type: type || "image/jpeg" }),
        );
      }),
    } as unknown as HTMLCanvasElement;

    document.createElement = vi.fn((tagName: string) => {
      if (tagName === "canvas") {
        return mockCanvas;
      }
      return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
    });

    const result = await imageToBase64(file);

    expect(mockCanvas.toBlob).toHaveBeenCalled();
    expect(result.startsWith("data:image/jpeg;base64,")).toBe(true);
  });
});
