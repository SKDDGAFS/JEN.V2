declare module 'howler' {
  export class Howl {
    constructor(options: {
      src: string[]
      html5?: boolean
      volume?: number
      onend?: () => void
    })
    play(): void
    pause(): void
    stop(): void
    unload(): void
    volume(volume: number): Howl
    seek(secs?: number): number
    duration(): number
  }
}
