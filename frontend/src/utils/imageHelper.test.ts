import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { imageToBase64, isValidImageFile, getImageUrl } from "./imageHelper.js";

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

  it("returns fallback image when fotoBase64 is null", () => {
    const result = getImageUrl(null);

    expect(result).toContain("data:image/svg+xml");
  });

  it("returns original image when fotoBase64 exists", () => {
    const image = "data:image/png;base64,abc";

    expect(getImageUrl(image)).toBe(image);
  });

  it("throws when image loading fails during compression", async () => {
    class ErrorImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      width = 1000;
      height = 1000;

      set src(_value: string) {
        setTimeout(() => {
          this.onerror?.();
        }, 0);
      }
    }

    Object.defineProperty(globalThis, "Image", {
      value: ErrorImage,
      configurable: true,
    });

    const largeContent = new Uint8Array(5 * 1024 * 1024 + 10);
    const file = new File([largeContent], "quebrada.jpg", {
      type: "image/jpeg",
    });

    await expect(imageToBase64(file)).rejects.toThrow(
      "Não foi possível carregar a imagem",
    );
  });

  it("throws when canvas context is unavailable", async () => {
    const largeContent = new Uint8Array(5 * 1024 * 1024 + 20);
    const file = new File([largeContent], "sem-contexto.jpg", {
      type: "image/jpeg",
    });

    const mockCanvas = {
      getContext: vi.fn(() => null),
      toBlob: vi.fn(),
      width: 0,
      height: 0,
    } as unknown as HTMLCanvasElement;

    document.createElement = vi.fn((tagName: string) => {
      if (tagName === "canvas") {
        return mockCanvas;
      }
      return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
    });

    await expect(imageToBase64(file)).rejects.toThrow(
      "Não foi possível processar a imagem",
    );
  });

  it("throws when canvas conversion returns null blob", async () => {
    const largeContent = new Uint8Array(5 * 1024 * 1024 + 30);
    const file = new File([largeContent], "blob-null.jpg", {
      type: "image/jpeg",
    });

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({
        fillStyle: "",
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        drawImage: vi.fn(),
      })),
      toBlob: vi.fn((callback: (blob: Blob | null) => void) => {
        callback(null);
      }),
    } as unknown as HTMLCanvasElement;

    document.createElement = vi.fn((tagName: string) => {
      if (tagName === "canvas") {
        return mockCanvas;
      }
      return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
    });

    await expect(imageToBase64(file)).rejects.toThrow(
      "Não foi possível processar a imagem",
    );
  });

  it("throws when image remains larger than 5MB after max attempts", async () => {
    const largeContent = new Uint8Array(5 * 1024 * 1024 + 40);
    const file = new File([largeContent], "imensa.webp", {
      type: "image/webp",
    });

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
          new Blob([new Uint8Array(6 * 1024 * 1024)], {
            type: type || "image/webp",
          }),
        );
      }),
    } as unknown as HTMLCanvasElement;

    document.createElement = vi.fn((tagName: string) => {
      if (tagName === "canvas") {
        return mockCanvas;
      }
      return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
    });

    await expect(imageToBase64(file)).rejects.toThrow(
      "Não foi possível reduzir a imagem para até 5MB. Tente uma imagem menor.",
    );
  });

  it("rejects GIF larger than 5MB to avoid losing animation/transparency", async () => {
    const largeContent = new Uint8Array(5 * 1024 * 1024 + 50);
    const file = new File([largeContent], "animado.gif", { type: "image/gif" });

    await expect(imageToBase64(file)).rejects.toThrow(
      "GIF acima de 5MB não é suportado para compressão automática. Use um GIF menor ou outro formato.",
    );
  });
});
