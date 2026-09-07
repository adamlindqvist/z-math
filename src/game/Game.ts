import { type Area } from "./Area";
import { DungeonArea } from "./dungeons/DungeonArea";
import { DUNGEONS, resolveRoom } from "./dungeons/definitions";
import * as THREE from "three";
import { World } from "./World";
import { Player } from "./Player";
import { GameCamera } from "./Camera";
import { Input } from "./Input";
import { InteractionSystem } from "./InteractionSystem";
import { gameStore } from "../store/gameStore";
export class Game {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  world: Area;
  private areaKey = "";
  private previousDungeon: string | null = null;
  player = new Player();
  camera = new GameCamera();
  input = new Input();
  interactions: InteractionSystem;
  private frame = 0;
  private last = 0;
  private time = 0;
  private observer: ResizeObserver;
  private resetId = gameStore.getState().resetId;
  private contextLost = (event: Event) => {
    event.preventDefault();
    gameStore.pause();
    this.onError(
      "Grafiken pausades. Ladda om sidan för att fortsätta. Dina sparade Rupees finns kvar.",
    );
  };
  constructor(
    private container: HTMLElement,
    private onError: (message: string) => void,
  ) {
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (error) {
      this.input.dispose();
      throw error;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Gläntan: en tredimensionell värld med ett hus, en stig och en skattkista",
    );
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.addEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    this.scene.add(new THREE.HemisphereLight("#ffefd8", "#9da981", 2.2));
    const sun = new THREE.DirectionalLight("#fff0d2", 2.8);
    sun.position.set(-8, 17, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -18,
      right: 18,
      top: 18,
      bottom: -18,
      near: 1,
      far: 50,
    });
    sun.shadow.normalBias = 0.04;
    sun.shadow.bias = -0.0003;
    sun.shadow.radius = 4;
    this.scene.add(sun);
    this.world = this.createArea();
    this.scene.add(this.player.root);
    this.mountArea();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ opacity: 0.12 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.35;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.interactions = new InteractionSystem(this.scene);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();
    this.camera.update(this.player.position, 1);
    this.frame = requestAnimationFrame(this.tick);
  }
  private createArea(): Area {
    const location = gameStore.getState().location;
    this.areaKey = JSON.stringify(location);
    const found = resolveRoom(location);
    return found ? new DungeonArea(found.dungeon, found.room) : new World();
  }
  private mountArea() {
    this.scene.add(this.world.root);
    const entrance = DUNGEONS.find(
      (d) => d.id === this.previousDungeon,
    )?.entrance;
    const spawn =
      this.world.cameraMode === "glade" && entrance
        ? { x: entrance.x, z: entrance.z + 1.4 }
        : this.world.spawn;
    this.player.reset();
    this.player.position.set(spawn.x, 0, spawn.z);
    this.input.reset();
    this.camera.setMode(this.world.cameraMode, this.player.position);
    this.renderer.domElement.setAttribute(
      "aria-label",
      resolveRoom(gameStore.getState().location)?.room.name ??
        "Gläntan med Mosstemplets ingång",
    );
  }
  private resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (w && h) {
      this.renderer.setSize(w, h);
      this.camera.resize(w, h);
    }
  }
  private tick = (now: number) => {
    const dt = Math.min(this.last ? (now - this.last) / 1000 : 0, 0.04);
    this.last = now;
    this.time += dt;
    const state = gameStore.getState();
    if (this.areaKey !== JSON.stringify(state.location)) {
      const previous = JSON.parse(this.areaKey);
      this.previousDungeon = previous?.dungeon ?? null;
      this.world.dispose();
      this.world = this.createArea();
      this.mountArea();
    }
    if (state.resetId !== this.resetId) {
      this.resetId = state.resetId;
      this.previousDungeon = null;
      this.mountArea();
    }
    this.world.update(dt, this.time);
    if (!state.overlay && !state.motion)
      this.player.update(
        dt,
        this.input,
        this.world.collision,
        this.world.cameraMode === "room",
        this.world.tryPush?.bind(this.world),
      );
    this.interactions.update(this.player.position, this.world, this.time);
    this.camera.update(this.player.position, dt);
    this.renderer.render(this.scene, this.camera.camera);
    this.frame = requestAnimationFrame(this.tick);
  };
  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.input.dispose();
    this.world.dispose();
    this.renderer.domElement.removeEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        geometries.add(o.geometry);
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
          materials.add(m),
        );
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
