// @flow
// $FlowIgnore 类型定义被直接写在toxic-decorators，不想搬了，忽略flow check
import HlsCore from '@gem-mine/hls.js';
import { CustEvent, deepAssign, Log, isElement, isObject } from 'chimee-helper';
import defaultCustomConfig from './custom-config.js';
import { autobind } from 'toxic-decorators';

declare type KernelConfig = {
  src: string,
  isLive: boolean,
  box: string,
  preset: {
    [string]: Function,
  },
  presetConfig: {
    [string]: Object,
  },
  hlsCustomKey: {
    isCustomKey: Boolean,
    customKeyUrl: String,
    customSign: String,
    char2buf: Function,
    customDecrypt: Function
  }
};

const LOG_TAG = 'chimee-kernel-hls';

export default class Hls extends CustEvent {
  version: string;
  video: HTMLVideoElement;
  config: KernelConfig;
  customConfig: CustomConfig;
  version = process.env.VERSION;
  hlsKernel: any

  static isSupport() {
    return HlsCore.isSupported();
  }

  constructor(videoElement: HTMLVideoElement, config: KernelConfig, customConfig: CustomConfig = {}) {
    super();
    if (!isElement(videoElement)) throw new Error(`video element passed in ${LOG_TAG} must be a HTMLVideoElement, but not ${typeof videoElement}`);
    if (!isObject(config)) throw new Error(`config of ${LOG_TAG} must be an Object but not ${typeof config}`);
    this.video = videoElement;
    this.config = config;
    this.customConfig = deepAssign({}, defaultCustomConfig, customConfig);
    this.hlsKernel = new HlsCore(this.customConfig);
    const { hlsCustomKey } = config;
    if (hlsCustomKey) {
      this.hlsKernel.isCustomKey = hlsCustomKey.isCustomKey;
      this.hlsKernel.customKeyUrl = hlsCustomKey.customKeyUrl;
      this.hlsKernel.customSign = hlsCustomKey.customSign;
      this.hlsKernel.char2buf = hlsCustomKey.char2buf;
      this.hlsKernel.customDecrypt = hlsCustomKey.customDecrypt;
    }
    this.bindEvents();
    this.attachMedia();
  }

  bindEvents(remove: boolean = false) {
    const hlsKernel = this.hlsKernel;
    /* istanbul ignore else */
    if (hlsKernel) {
      hlsKernel[remove ? 'off' : 'on'](HlsCore.Events.ERROR, this.hlsErrorHandler);
    }
  }

  load() {
    return this.hlsKernel.loadSource(this.config.src);
  }

  startLoad() {
    return this.hlsKernel.startLoad();
  }

  stopLoad() {
    return this.hlsKernel.stopLoad();
  }

  attachMedia() {
    return this.hlsKernel.attachMedia(this.video);
  }

  play() {
    return this.video.play();
  }

  destroy() {
    this.bindEvents(true);
    return this.hlsKernel.destroy();
  }

  seek(seconds: number) {
    this.video.currentTime = seconds;
  }

  pause() {
    return this.video.pause();
  }

  refresh() {
    this.hlsKernel.stopLoad();
    return this.hlsKernel.loadSource(this.config.src);
  }

  @autobind
  hlsErrorHandler(event: string, data: Object) {
    this.emit('error', data);
    this.emit(event, data);
    /* istanbul ignore next */
    Log.error(LOG_TAG + (event ? ' ' + event : ''), data.details);
  }
}
