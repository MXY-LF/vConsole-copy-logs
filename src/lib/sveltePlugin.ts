/*
 * @Descripttion:
 * @Author: xiangyumeng@webank.com
 * @LastEditTime: 2024-10-16 16:10:36
 */
import VConsolePlugin from "./plugin";
import { SvelteComponent } from "svelte";


export class VConsoleSveltePlugin<T extends {} = {}> extends VConsolePlugin {
  CompClass: typeof SvelteComponent;
  compInstance?: SvelteComponent;
  initialProps: T;

  constructor(
    id: string,
    name: string,
    CompClass: typeof SvelteComponent,
    initialProps: T
  ) {
    super(id, name);
    this.CompClass = CompClass;
    this.initialProps = initialProps;
  }

  onReady() {
    this.isReady = true;
  }

  onRenderTab(callback) {
    const $container = document.createElement("div");
    const compInstance = (this.compInstance = new this.CompClass({
      target: $container,
      props: this.initialProps,
    }));
    console.log("onRenderTab", this.compInstance);
    callback($container.firstElementChild, compInstance.options);
  }

  onRemove() {
    super.onRemove && super.onRemove();
    if (this.compInstance) {
      this.compInstance.$destroy();
    }
  }
}
