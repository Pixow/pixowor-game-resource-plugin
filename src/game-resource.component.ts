import slash from "slash";
import { CommonModule } from "@angular/common";
import { Component, NgModule, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FileStat, PixoworCore, FileConfig } from "pixowor-core";
import pkg from "../package.json";
import { TranslocoService } from "@ngneat/transloco";
import { TreeModule } from "primeng/tree";
import { ContextMenuModule } from "primeng/contextmenu";
import { ContextMenuService, MenuItem, TreeNode } from "primeng/api";
import * as path from "path";
import * as fs from "fs";
import { Capsule, Constants, ElementNode, NodeType, SceneNode } from "game-capsule";
import { CreateElementComponent } from "./create-element.component";
import { DialogService, DynamicDialogModule } from "primeng/dynamicdialog";

@Component({
  selector: "game-resource",
  templateUrl: "./game-resource.component.html",
  styleUrls: ["./game-resource.component.scss"],
  providers: [DialogService, ContextMenuService],
})
export class GameResourceComponent implements OnInit {
  files: TreeNode[] = [];
  items: MenuItem[];
  public version = pkg.version;
  translocoService: TranslocoService;
  selectedFile: TreeNode;

  gameFolder: string;

  constructor(
    private pixoworCore: PixoworCore,
    public dialogService: DialogService
  ) {
    this.translocoService =
      pixoworCore.serviceManager.getService<TranslocoService>(TranslocoService);
  }

  ngOnInit() {
    const fileConfig = this.pixoworCore.getEditingGame() as FileConfig;

    if (!fileConfig) return;

    const { file, filePath } = fileConfig;

    const { GAME_PROJECTS_PATH } = this.pixoworCore.settings;

    this.gameFolder = filePath;

    this.getResourceFiles();

    // init GameCapsule
    const gameCapsule = new Capsule();
    gameCapsule.deserialize(fs.readFileSync(path.join(filePath, `${file}.pi`)));
    this.pixoworCore.stateManager.getVariable("GameCapsule").next(gameCapsule);

    this.items = [
      {
        label: "New Folder",
        command: () => {},
      },
      {
        label: "Create Element",
        command: (event) => {
          const filePath = (this.selectedFile as FileStat).path;
          const ref = this.dialogService.open(CreateElementComponent, {
            header: "Create Element",
          });

          ref.onClose.subscribe((name) => {
            const cap = new Capsule();
            const element = cap.add.element();
            const animations = cap.add.animations(element);
            const animationData = cap.add.animationdata(animations);
            animations.defaultAnimation = animationData.name;
            element.name = name;

            const elementDir = path.join(filePath, name);
            this.pixoworCore.fileSystemManager
              .writeFile(
                path.join(elementDir, `${name}.pi`),
                cap.serialize()
              )
              .then(() => {
                this.getResourceFiles();
              });
          });
        },
      },
      {
        label: "Create Avatar",
        command: () => {},
      },
      {
        label: "Create Palette",
        command: (event) => {},
      },
      {
        label: "Create Scene",
        command: () => {},
      },
      {
        label: "Edit Scene",
        command: () => {
          const filePath = (this.selectedFile as FileStat).path;
          const sceneCapsule = new Capsule();
          sceneCapsule.deserialize(fs.readFileSync(filePath));

          this.pixoworCore.setEditingScene({
            file: (this.selectedFile as FileStat).file,
            filePath: (this.selectedFile as FileStat).path
          })

          this.pixoworCore.stateManager
            .getVariable("SceneCapsule")
            .next(sceneCapsule);
        },
      },
      {
        label: "Use As Brush",
        command: () => {
          const sceneCapsule: Capsule = this.pixoworCore.stateManager.getVariable<Capsule>("SceneCapsule").getValue();
          const scene = sceneCapsule.treeNodes[0] as SceneNode
          
          const file = (this.selectedFile as FileStat).file;
          const filePath = (this.selectedFile as FileStat).path;

          const elementCap = new Capsule();
          elementCap.deserialize(fs.readFileSync(filePath));
          const element = elementCap.treeNodes[0] as ElementNode;

          const reg = /\/(.*\/.*)\//;
          // Conver Windows backslash paths to slash paths foo\\bar -> foo/bar
          const sourcePath = slash(filePath.split(file)[0].split(this.gameFolder)[1]);

          const ret = sourcePath.match(reg); // Like Package/TestElement
          if (ret) {
            element.resRootPath = ret[1];
          } 

          scene.addElementPrefab(element.id, element);

          const sceneEditorCanvas = this.pixoworCore.stateManager
            .getVariable<any>("SceneEditorCanvas")
            .getValue();

          sceneEditorCanvas.updateElementPrefabs(scene.elementPrefabs)

          sceneEditorCanvas.setBrush(
            element.id
          );
        },
      },
      {
        label: "Edit",
        command: (event) => {
          const file = (this.selectedFile as FileStat).path;
          const cap = new Capsule();
          cap.deserialize(fs.readFileSync(file));

          if (cap.treeNodes[0].type === NodeType.ElementNodeType) {
            this.pixoworCore.ipcRenderer.send("openSubWindow", {
              pluginId: "pixowor-element-editor-plugin",
              name: cap.treeNodes[0].name,
              width: 1200,
              height: 890,
            });

            this.pixoworCore.setEditingElement({
              file: (this.selectedFile as FileStat).file,
              filePath: (this.selectedFile as FileStat).path,
            });
          }
        },
      },
      {
        label: "Rename",
        command: () => {},
      },
      {
        label: "Delete File",
        command: (event) => {},
      },
    ];
  }

  getResourceFiles() {
    // Get Resource Files
    this.pixoworCore.fileSystemManager
      .listDir(this.gameFolder)
      .then((files) => {
        console.log("Files: ", files);
        this.files = this.getFilesTree(files);
      });
  }

  getFilesTree(files: FileStat[]): TreeNode[] {
    for (const file of files) {
      (file as TreeNode).label = file.file;

      if (file.files) {
        (file as TreeNode).children = this.getFilesTree(file.files);
      }
    }

    return files as TreeNode[];
  }

  createScene() {
    const sceneCapsule = new Capsule();
    const scene = sceneCapsule.add.scene();
    console.log("🚀 ~ file: game-resource.component.ts ~ line 188 ~ GameResourceComponent ~ createScene ~ scene", scene)

    fs.writeFileSync(
      path.join(this.gameFolder, `${scene.name}.pi`),
      sceneCapsule.serialize()
    );

    this.getResourceFiles();
  }

  openGameResource() {
    const shell = require("electron").shell;
    shell.openPath(this.gameFolder);
  }
}

@NgModule({
  imports: [
    CommonModule,
    TreeModule,
    FormsModule,
    DynamicDialogModule,
    ContextMenuModule,
  ],
  declarations: [GameResourceComponent, CreateElementComponent],
})
export class GameResourceModule {}
