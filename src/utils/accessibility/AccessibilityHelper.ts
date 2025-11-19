export class AccessibilityHelper {
  static setupKeyboardNavigation(): void {
    const skipLink = document.createElement('a')
    skipLink.href = '#main-content'
    skipLink.textContent = 'Skip to main content'
    skipLink.className = 'skip-link'
    skipLink.style.cssText = `position: absolute; top: -40px; left: 6px; background: #000; color: #fff; padding: 8px; text-decoration: none; z-index: 1000; transform: translateY(-100%); transition: transform 0.2s;`
    skipLink.addEventListener('focus', () => { skipLink.style.transform = 'translateY(0)' })
    skipLink.addEventListener('blur', () => { skipLink.style.transform = 'translateY(-100%)' })
    document.body.insertBefore(skipLink, document.body.firstChild)

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement | null
        if (openModal) this.closeModal(openModal)
      }
      if (e.key === 'Tab') {
        const openModal = document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement | null
        if (openModal) this.trapFocus(e, openModal)
      }
    })
  }

  private static trapFocus(e: KeyboardEvent, modal: HTMLElement): void {
    const focusable = modal.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { last.focus(); e.preventDefault() }
    } else {
      if (document.activeElement === last) { first.focus(); e.preventDefault() }
    }
  }

  private static closeModal(modal: HTMLElement): void {
    modal.setAttribute('aria-modal', 'false')
    modal.style.display = 'none'
    const triggerId = modal.getAttribute('data-trigger-id')
    if (triggerId) document.getElementById(triggerId)?.focus()
  }

  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const el = document.createElement('div')
    el.setAttribute('aria-live', priority)
    el.setAttribute('aria-atomic', 'true')
    el.className = 'sr-only'
    el.textContent = message
    document.body.appendChild(el)
    setTimeout(() => { document.body.removeChild(el) }, 1000)
  }

  static checkColorContrast(foreground: string, background: string): { ratio: number; passAAA: boolean; passAA: boolean } {
    const fg = this.getLuminance(foreground)
    const bg = this.getLuminance(background)
    const brightest = Math.max(fg, bg)
    const darkest = Math.min(fg, bg)
    const ratio = (brightest + 0.05) / (darkest + 0.05)
    return { ratio, passAA: ratio >= 4.5, passAAA: ratio >= 7 }
  }

  private static getLuminance(color: string): number {
    const rgb = this.hexToRgb(color); if (!rgb) return 0
    const { r, g, b } = rgb
    const rs = r / 255, gs = g / 255, bs = b / 255
    const rL = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4)
    const gL = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4)
    const bL = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4)
    return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null
  }

  static validateImageAltText(img: HTMLImageElement): string[] {
    const issues: string[] = []
    const alt = img.getAttribute('alt')
    if (!alt) issues.push('Missing alt text')
    else if (alt.trim() === '') issues.push('Empty alt text')
    else if (alt.length > 125) issues.push('Alt text too long (should be under 125 characters)')
    else if (/^(image|picture|photo) of/i.test(alt)) issues.push('Avoid starting alt text with "image of" or "picture of"')
    return issues
  }

  static validateFormAccessibility(form: HTMLFormElement): string[] {
    const issues: string[] = []
    const inputs = form.querySelectorAll('input, select, textarea')
    inputs.forEach((input) => {
      const label = form.querySelector(`label[for="${(input as HTMLInputElement).id}"]`)
      const ariaLabel = input.getAttribute('aria-label')
      const ariaLabelledBy = input.getAttribute('aria-labelledby')
      if (!label && !ariaLabel && !ariaLabelledBy) issues.push(`Input ${(input as any).id || (input as any).name || 'unknown'} has no accessible label`)
      if (input.hasAttribute('required') && !input.hasAttribute('aria-required')) issues.push(`Required input ${(input as any).id || (input as any).name || 'unknown'} should have aria-required="true"`)
      const describedBy = input.getAttribute('aria-describedby')
      if (input.classList.contains('error') && describedBy && !form.querySelector(`#${describedBy}`)) {
        issues.push(`Input ${(input as any).id || (input as any).name || 'unknown'} has error state but no aria-describedby target`)
      }
    })
    return issues
  }
}

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    AccessibilityHelper.setupKeyboardNavigation()
  })
}
