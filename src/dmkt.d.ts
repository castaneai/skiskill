// https://anime.dmkt-sp.jp/js/cms/player.min.js
type VideoController = {
    videoEl: HTMLVideoElement;
    jump: (to: number) => void;
};

// merge interface
interface Window {
    vc: VideoController;
}
