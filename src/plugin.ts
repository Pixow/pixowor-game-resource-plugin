import {Plugin, PixoworCore, UIEvents} from 'pixowor-core'
import { GameResourceComponent } from "./game-resource.component";
import manifest from "../manifest.json";
import { Component, Type } from '@angular/core';
import zhCN from "./i18n/zh-CN.json"
import en from './i18n/en.json'

export class GameResourcePlugin extends Plugin {
  constructor(pixoworCore: PixoworCore) {
    super(pixoworCore, manifest);
  }

  async prepare(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.pixoworCore.fileSystemManager
        .installI18n({
          en: en,
          "zh-CN": zhCN,
        })
        .then(() => {
          console.log("Test plugin prepare");
          resolve(true);
        })
        .catch((error) => reject(error));
    });
  }

  activate() {
    this.colorLog(`${this.name} activate, Pid: ${this.pid}`);
    this.pixoworCore.stateManager.registerComponent(
      "GameResource",
      <Component>GameResourceComponent
    );

    console.log("GameResource Plugin Load in Sidebar ")

    this.pixoworCore.workspace.emit(UIEvents.LOAD_IN_SIDEBAR, {
      componentName: "GameResource",
      sequence: 2,
      header: "游戏资源管理"
    });
  }

  deactivate() {
    
  }
}
