/*
 * @Descripttion:
 * @Author: xiangyumeng@webank.com
 * @LastEditTime: 2024-10-21 14:28:33
 */
import { VConsoleSveltePlugin } from "../lib/sveltePlugin";
import NetworkComp from "./network.svelte";
import { VConsoleNetworkModel } from "./network.model";
import { VConsoleNetworkExporter } from "./network.exporter";
import { JSONStringify } from "src/lib/tool";
import copy from "copy-to-clipboard";
const safeStringify = require("fast-safe-stringify");
const MAX_NETWORK_NUMBER = 1000;

export class VConsoleNetworkPlugin extends VConsoleSveltePlugin {
  public model: VConsoleNetworkModel = VConsoleNetworkModel.getSingleton(
    VConsoleNetworkModel,
    "VConsoleNetworkModel"
  );
  public exporter: VConsoleNetworkExporter;

  constructor(id: string, name: string, renderProps = {}) {
    super(id, name, NetworkComp, renderProps);
    this.exporter = new VConsoleNetworkExporter(id);
  }

  public onReady() {
    super.onReady();
    this.onUpdateOption();
  }

  public onAddTool(callback) {
    const toolList = [
      {
        name: "ExportLogs",
        global: false,
        onClick: (e) => {
          this.exportLog();
          // this.model.clearPluginLog(this.id);
          // this.vConsole.triggerEvent("clearLog");
        },
      },
      {
        name: "CopyLogs",
        global: false,
        onClick: (e) => {
          copy(safeStringify(this.model.RequestList));
          // this.model.clearPluginLog(this.id);
          // this.vConsole.triggerEvent("clearLog");
        },
      },
      {
        name: "Clear",
        global: false,
        onClick: (e) => {
          this.model.clearLog();
        },
      },
    ];
    callback(toolList);
  }

  public onRemove() {
    super.onRemove();
    if (this.model) {
      this.model.unMock();
    }
  }

  public exportLog() {
    function downloadObjectAsJson(obj, filename) {
      // 将对象转换为 JSON 字符串
      const jsonString = safeStringify(obj);

      // const logsContent = `\
      //     const logs = ${jsonString};
      //     export default logs;
      //       `;

      // 创建一个 Blob 对象，使用 UTF-8 编码
      const blob = new Blob([jsonString], { type: "application/json" });

      // 创建一个可下载的链接
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;

      // 触发下载
      document.body.appendChild(a);
      a.click();

      // 清理
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    }
    const log = this.model.RequestList;

    downloadObjectAsJson(log, `network.json`);
  }

  public onUpdateOption() {
    if (
      this.vConsole.option.network?.maxNetworkNumber !==
      this.model.maxNetworkNumber
    ) {
      this.model.maxNetworkNumber =
        Number(this.vConsole.option.network?.maxNetworkNumber) ||
        MAX_NETWORK_NUMBER;
    }
    if (this.vConsole.option.network?.ignoreUrlRegExp) {
      this.model.ignoreUrlRegExp = this.vConsole.option.network.ignoreUrlRegExp;
    }
    if (this.vConsole.option.network?.exportUrlRegExp) {
      this.model.exportUrlRegExp = this.vConsole.option.network.exportUrlRegExp;
    }
  }
}
