// This file is a workaround:
// enum cannot be used in a <script> block in a Svelte component
// without svelte-preprocess

export const enum NumMode {
  Result,
  ResultMem,
  Entering,
  EnteringNum,
  EnteringDec,
}
