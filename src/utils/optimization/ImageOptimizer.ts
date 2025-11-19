export class ImageOptimizer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    if (typeof document === 'undefined') {
      // @ts-ignore
      this.canvas = {} as any
      // @ts-ignore
      this.ctx = {} as any
      return
    }
    this.canvas = document.createElement('canvas')
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('2D context not available')
    this.ctx = ctx
  }

  async optimizeImage(file: File, options: { maxWidth?: number; maxHeight?: number; quality?: number; format?: 'webp' | 'jpeg' | 'png' } = {}): Promise<Blob> {
    const { maxWidth = 1920, maxHeight = 1080, quality = 0.8, format = 'webp' } = options
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        try {
          const { width, height } = this.calculateDimensions(img.width, img.height, maxWidth, maxHeight)
          this.canvas.width = width
          this.canvas.height = height
          this.ctx.drawImage(img, 0, 0, width, height)
          this.canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to optimize image'))
          }, `image/${format}`, quality)
        } catch (e) {
          reject(e)
        }
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  private calculateDimensions(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number): { width: number; height: number } {
    let width = originalWidth
    let height = originalHeight
    if (width > maxWidth) {
      height = (height * maxWidth) / width
      width = maxWidth
    }
    if (height > maxHeight) {
      width = (width * maxHeight) / height
      height = maxHeight
    }
    return { width: Math.round(width), height: Math.round(height) }
  }

  generatePlaceholder(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const { width, height } = this.calculateDimensions(img.width, img.height, 10, 10)
        this.canvas.width = width
        this.canvas.height = height
        this.ctx.drawImage(img, 0, 0, width, height)
        const placeholder = this.canvas.toDataURL('image/jpeg', 0.1)
        resolve(placeholder)
      }
      img.onerror = () => reject(new Error('Failed to generate placeholder'))
      img.src = URL.createObjectURL(file)
    })
  }

  setupLazyLoading(selector: string = '[data-lazy]'): IntersectionObserver | null {
    if (typeof IntersectionObserver === 'undefined') return null
    const images = document.querySelectorAll(selector)
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = (img as any).dataset.lazy as string | undefined
          if (src) { img.src = src; img.removeAttribute('data-lazy'); imageObserver.unobserve(img) }
        }
      })
    })
    images.forEach((img) => imageObserver.observe(img))
    return imageObserver
  }
}

export const imageOptimizer = new ImageOptimizer()
