import { VConsoleSveltePlugin } from "../lib/sveltePlugin";
import LogComp from "./log.svelte";
import { VConsoleLogModel } from "./log.model";
import { VConsoleLogExporter } from "./log.exporter";
import type { IConsoleLogMethod } from "./log.model";
import copy from "copy-to-clipboard";
import * as tool from "../lib/tool";
const safeStringify = require("fast-safe-stringify");
const MAX_LOG_NUMBER = 1000;

/**
 * vConsole Log Plugin (base class).
 */
export class VConsoleLogPlugin extends VConsoleSveltePlugin {
  public model: VConsoleLogModel = VConsoleLogModel.getSingleton(
    VConsoleLogModel,
    "VConsoleLogModel"
  );
  public isReady: boolean = false;
  public isShow: boolean = false;
  public isInBottom: boolean = true; // whether the panel is in the bottom

  constructor(id: string, name: string) {
    super(id, name, LogComp, { pluginId: id, filterType: "all" });
    this.model.bindPlugin(id);
    this.exporter = new VConsoleLogExporter(id);
  }

  public onReady() {
    super.onReady();
    this.model.maxLogNumber =
      Number(this.vConsole.option.log?.maxLogNumber) || MAX_LOG_NUMBER;
    this.compInstance.showTimestamps =
      !!this.vConsole.option.log?.showTimestamps;
  }

  public onRemove() {
    super.onRemove();
    this.model.unbindPlugin(this.id);
  }

  public onAddTopBar(callback: Function) {
    const types = ["All", "Log", "Info", "Warn", "Error"];
    const btnList = [];
    for (let i = 0; i < types.length; i++) {
      btnList.push({
        name: types[i],
        data: {
          type: types[i].toLowerCase(),
        },
        actived: i === 0,
        className: "",
        onClick: (
          e: PointerEvent,
          data: { type: "all" | IConsoleLogMethod }
        ) => {
          if (data.type === this.compInstance.filterType) {
            return false;
          }
          this.compInstance.filterType = data.type;
        },
      });
    }
    btnList[0].className = "vc-actived";
    callback(btnList);
  }

  public onAddTool(callback: Function) {
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
        name: "CopyLog",
        global: false,
        onClick: (e) => {
          copy(safeStringify(this.model.exportLogs));
          // this.exportCurrentHtml();
          // this.model.clearPluginLog(this.id);
          // this.vConsole.triggerEvent("clearLog");
        },
      },
      {
        name: "Clear",
        global: false,
        onClick: (e) => {
          this.model.clearPluginLog(this.id);
          this.vConsole.triggerEvent("clearLog");
        },
      },
      {
        name: "Top",
        global: false,
        onClick: (e) => {
          this.compInstance.scrollToTop();
        },
      },
      {
        name: "Bottom",
        global: false,
        onClick: (e) => {
          this.compInstance.scrollToBottom();
        },
      },
    ];
    callback(toolList);
  }

  public onUpdateOption() {
    if (this.vConsole.option.log?.maxLogNumber !== this.model.maxLogNumber) {
      this.model.maxLogNumber =
        Number(this.vConsole.option.log?.maxLogNumber) || MAX_LOG_NUMBER;
    }
    if (this.vConsole.option.log?.exportMethod) {
      this.model.exportMethod = this.vConsole.option.log?.exportMethod;
    }
    if (
      !!this.vConsole.option.log?.showTimestamps !==
      this.compInstance.showTimestamps
    ) {
      this.compInstance.showTimestamps =
        !!this.vConsole.option.log?.showTimestamps;
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

    const log = this.model.exportLogs;

    // function formatObj(log: any) {
    //   const result = [];
    //   log.forEach((item) => {
    //     const formatObj = tool.removeLargeFields(item.origData);
    //     result.push(formatObj);
    //   });
    //   return result;
    // }
    // const formatLog = [];
    // log.forEach((item) => {
    //   const string = safeStringify(item);
    //   const logData = formatObj(JSON.parse(string));
    //   formatLog.push({ logData });
    // });

    downloadObjectAsJson(log, `log.json`);
    // this.exportJsonToFile(this.model.exportLogs, `log.json`);
  }
  // 导出 JSON 到文件的函数
  public exportJsonToFile(jsonData, fileName) {
    requestIdleCallback((deadline) => {
      if (deadline.timeRemaining() > 0) {
        window.alert("start doownload!!!,别点");
        try {
          function formatObj(log: any) {
            const result = [];
            log.forEach((item) => {
              const formatObj = tool.removeLargeFields(item.origData);
              result.push(formatObj);
            });
            return result;
          }
          const formatLog = [];
          jsonData.forEach((item) => {
            const string = safeStringify(item);
            const logData = formatObj(JSON.parse(string));
            formatLog.push({ logData });
          });
          // 将 JSON 对象转换为字符串
          const jsonString = JSON.stringify(formatLog, null, 2);

          // 创建 Blob 对象
          const blob = new Blob([jsonString], { type: "application/json" });

          // 创建下载链接
          const downloadLink = document.createElement("a");
          downloadLink.href = URL.createObjectURL(blob);
          downloadLink.download = fileName;

          // 触发点击事件
          downloadLink.click();

          // 释放 URL 对象
          URL.revokeObjectURL(downloadLink.href);
        } catch (error) {
          console.error("Error exporting JSON:", error);
        }
      } else {
        // 如果没有空闲时间，继续请求空闲时间
        requestIdleCallback((deadline) => {
          this.exportJsonToFile(jsonData, fileName);
        });
      }
    });
  }

  public exportCurrentHtml() {
    // 获取整个 HTML 文档的根元素
    const htmlElement = document.documentElement;

    // 克隆整个 HTML 元素
    const clonedHtml = htmlElement.cloneNode(true);

    // 移除克隆的 <body> 元素
    // const bodyElement = clonedHtml.querySelector("body");
    // if (bodyElement) {
    //   bodyElement.remove();
    // }

    // 将修改后的 DOM 转换为字符串
    const serializer = new XMLSerializer();
    const htmlString = serializer.serializeToString(clonedHtml);
    // const cleanedContent = htmlString.replace(
    //   /<[^>]*class="[^"]*vc-icon-copy[^"]*"[^>]*>/gi,
    //   ""
    // );
    // 创建一个Blob对象，用于保存HTML内容
    const blob = new Blob([htmlString], {
      type: "text/html",
    });
    // 创建一个链接元素，用于下载
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "exported.html";
    // 触发下载
    link.click();
    // 清理URL对象
    URL.revokeObjectURL(link.href);
  }
}

export default VConsoleLogPlugin;
