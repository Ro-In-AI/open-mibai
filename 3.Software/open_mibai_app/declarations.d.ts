declare module '*.mp3' {
    const src: number; // 注意：对于 RN 是资源 ID（数字），不是 string
    export default src;
  }