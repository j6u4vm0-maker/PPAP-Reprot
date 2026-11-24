import type { SymbolItem } from "@/types/ppap";

export interface SymbolApplyResult {
  nextValue: string;
  nextCursor: number;
}

/**
 * 依據符號插入模式（包覆 / 前綴 / 後綴 / 游標插入）智慧更新 Dimension 字串與游標位置
 */
export function applyQuickSymbol(
  currentValue: string,
  symbol: SymbolItem,
  selectionStart?: number | null,
  selectionEnd?: number | null
): SymbolApplyResult {
  const val = currentValue || "";
  const trimmed = val.trim();

  if (symbol.mode === "wrap") {
    const open = symbol.value.length >= 2 ? symbol.value[0] : "(";
    const close = symbol.value.length >= 2 ? symbol.value[symbol.value.length - 1] : ")";
    if (!trimmed) {
      return { nextValue: `${open}${close}`, nextCursor: open.length };
    }
    if (trimmed.startsWith(open) && trimmed.endsWith(close)) {
      const unwrapped = trimmed.slice(open.length, trimmed.length - close.length);
      return { nextValue: unwrapped, nextCursor: unwrapped.length };
    }
    const wrapped = `${open}${trimmed}${close}`;
    return { nextValue: wrapped, nextCursor: wrapped.length };
  }

  if (symbol.mode === "prefix") {
    const tok = symbol.value;
    if (!trimmed) {
      return { nextValue: tok, nextCursor: tok.length };
    }
    if (trimmed.startsWith(tok)) {
      const removed = trimmed.slice(tok.length).trimStart();
      return { nextValue: removed, nextCursor: removed.length };
    }
    const prefixed = `${tok}${trimmed}`;
    return { nextValue: prefixed, nextCursor: prefixed.length };
  }

  if (symbol.mode === "suffix") {
    const tok = symbol.value;
    const needsSpace = /^[A-Za-z0-9]/.test(tok);
    if (!trimmed) {
      return { nextValue: tok, nextCursor: tok.length };
    }
    const suffixWithSpace = needsSpace ? ` ${tok}` : tok;
    if (trimmed.endsWith(suffixWithSpace)) {
      const removed = trimmed.slice(0, trimmed.length - suffixWithSpace.length).trimEnd();
      return { nextValue: removed, nextCursor: removed.length };
    }
    if (trimmed.endsWith(tok)) {
      const removed = trimmed.slice(0, trimmed.length - tok.length).trimEnd();
      return { nextValue: removed, nextCursor: removed.length };
    }
    const suffixed = `${trimmed}${suffixWithSpace}`;
    return { nextValue: suffixed, nextCursor: suffixed.length };
  }

  // insert mode：直接插入於游標選取位置
  const start = selectionStart ?? val.length;
  const end = selectionEnd ?? val.length;
  const nextValue = `${val.slice(0, start)}${symbol.value}${val.slice(end)}`;
  return { nextValue, nextCursor: start + symbol.value.length };
}
