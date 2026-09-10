import { VolcanoArea } from "./VolcanoArea";
import { portalSpawn, VOLCANO_ENTRANCE } from "./volcanoPortal";
import { ThroneRoomArea } from "./castle/ThroneRoomArea";
import { CastleArea, ShopScene, CASTLE_ENTRANCE } from "./castle/CastleArea";
import type { Location } from "./dungeons/definitions";
import { type Area } from "./Area";
import { DungeonArea } from "./dungeons/DungeonArea";
import { DUNGEONS, resolveRoom } from "./dungeons/definitions";
import * as THREE from "three";
import { World } from "./World";
import { Player } from "./Player";
import { GameCamera } from "./Camera";
import { Input } from "./Input";
import { InteractionSystem, pickInteraction } from "./InteractionSystem";
import { gameStore } from "../store/gameStore";
export class Game {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  world: Area;
  private areaKey = "";
  private previousLocation: Location = null;
  private tap: { id: number; x: number; y: number; time: number } | null = null;
  private cancelTap = () => {
    this.tap = null;
  };
  private pointerMove = (e: PointerEvent) => {
    if (
      this.tap?.id === e.pointerId &&
      Math.hypot(e.clientX - this.tap.x, e.clientY - this.tap.y) > 12
    )
      this.cancelTap();
  };
  private visibilityTap = () => {
    if (document.hidden) this.cancelTap();
  };
  private pointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || gameStore.getState().overlay) return;
    if (this.tap) {
      this.cancelTap();
      return;
    }
    this.tap = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      time: e.timeStamp,
    };
  };
  private pointerUp = (e: PointerEvent) => {
    const tap = this.tap;
    this.tap = null;
    if (
      !tap ||
      tap.id !== e.pointerId ||
      e.timeStamp - tap.time > 500 ||
      Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 12 ||
      gameStore.getState().overlay
    )
      return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const target = pickInteraction(
      this.world,
      this.player.position,
      this.camera.camera,
      new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      ),
    );
    if (target) {
      gameStore.setTarget(target);
      gameStore.interact();
    }
  };
  private previousDungeon: string | null = null;
  player = new Player();
  camera = new GameCamera();
  input = new Input();
  interactions: InteractionSystem;
  private unsubscribeEquipment: () => void = () => {};
  private frame = 0;
  private last = 0;
  private time = 0;
  private observer: ResizeObserver;
  private resetId = gameStore.getState().resetId;
  // The sun follows the player so its shadow frustum covers whichever area is
  // in view; a fixed frustum clipped shadows off in the distant south glade.
  private sun = new THREE.DirectionalLight("#fff0d2", 2.8);
  private sunOffset = new THREE.Vector3(-8, 17, 9).setLength(40);
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
      "Gläntan: en tredimensionell värld med ett medeltida slott, en stig och en skattkista",
    );
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.addEventListener("pointerdown", this.pointerDown);
    this.renderer.domElement.addEventListener("pointerup", this.pointerUp);
    this.renderer.domElement.addEventListener("pointercancel", this.cancelTap);
    window.addEventListener("blur", this.cancelTap);
    document.addEventListener("visibilitychange", this.visibilityTap);
    this.renderer.domElement.addEventListener("pointermove", this.pointerMove);
    this.renderer.domElement.addEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    this.scene.add(new THREE.HemisphereLight("#ffefd8", "#9da981", 2.2));
    const sun = this.sun;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -20,
      right: 20,
      top: 20,
      bottom: -20,
      near: 1,
      far: 80,
    });
    sun.shadow.normalBias = 0.04;
    sun.shadow.bias = -0.0003;
    sun.shadow.radius = 4;
    this.scene.add(sun, sun.target);
    this.updateSun();
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
    this.player.setEquipment(gameStore.getState().equipment);
    let equipment = gameStore.getState().equipment;
    this.unsubscribeEquipment = gameStore.subscribe(() => {
      if (gameStore.getState().overlay) this.cancelTap();
      const next = gameStore.getState().equipment;
      if (next !== equipment) {
        equipment = next;
        this.player.setEquipment(next);
      }
    });
    this.frame = requestAnimationFrame(this.tick);
  }
  private createArea(): Area {
    const location = gameStore.getState().location;
    this.areaKey = JSON.stringify(location);
    if (location?.world === "volcano") return new VolcanoArea();
    if (location?.castle === "throne") return new ThroneRoomArea();
    if (location?.castle === "hall") return new CastleArea();
    if (location?.castle === "shop") return new ShopScene();
    const found = resolveRoom(location);
    return found ? new DungeonArea(found.dungeon, found.room) : new World();
  }
  private mountArea() {
    this.cancelTap();
    this.scene.add(this.world.root);
    const entrance = DUNGEONS.find(
      (d) => d.id === this.previousDungeon,
    )?.entrance;
    const castleSpawn =
      !gameStore.getState().location && this.previousLocation?.castle === "hall"
        ? { x: CASTLE_ENTRANCE.x, z: CASTLE_ENTRANCE.z + 1.4 }
        : gameStore.getState().location?.castle === "hall" &&
            this.previousLocation?.castle === "shop"
          ? { x: 3, z: 0 }
          : gameStore.getState().location?.castle === "hall" && this.previousLocation?.castle === "throne"
            ? { x: 0, z: -2.5 } : null;
    const spawn =
      (!gameStore.getState().location && this.previousLocation?.world === "volcano" ? portalSpawn(VOLCANO_ENTRANCE, 1) : null) ??
      castleSpawn ??
      (!gameStore.getState().location && entrance
        ? {
            x: entrance.x + Math.sin(entrance.rotation ?? 0) * 1.4,
            z: entrance.z + Math.cos(entrance.rotation ?? 0) * 1.4,
          }
        : this.world.spawn);
    this.player.reset();
    this.player.position.set(spawn.x, 0, spawn.z);
    this.input.reset();
    this.camera.setMode(this.world.cameraMode, this.player.position);
    this.renderer.domElement.setAttribute(
      "aria-label",
      (gameStore.getState().location?.world === "volcano" ? "Vulkanvärlden med askstigar, lava och en portal till gläntan" : gameStore.getState().location?.castle === "hall"
        ? "Slottets entréhall"
        : gameStore.getState().location?.castle === "shop"
          ? "Bosses butik"
          : gameStore.getState().location?.castle === "throne" ? "Kungasalen" : undefined) ??
        resolveRoom(gameStore.getState().location)?.room.name ??
        "Gläntan med slottet, Zelda, Vattentemplet och Bokoblins bro till södra gläntan med Eldtemplet",
    );
  }
  // Snapped to whole units so the shadow map does not crawl while walking.
  private updateSun() {
    const { x, z } = this.player.position;
    this.sun.target.position.set(Math.round(x), 0, Math.round(z));
    this.sun.position.copy(this.sun.target.position).add(this.sunOffset);
    this.sun.target.updateMatrixWorld();
    this.sun.shadow.camera.updateProjectionMatrix();
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
      this.previousLocation = previous;
      this.previousDungeon = previous?.dungeon ?? null;
      this.world.dispose();
      this.world = this.createArea();
      this.mountArea();
    }
    if (state.resetId !== this.resetId) {
      this.resetId = state.resetId;
      this.previousDungeon = null;
      this.previousLocation = null;
      this.mountArea();
    }
    this.world.update(dt, this.time, this.player.position);
    if (!state.overlay && !state.motion)
      this.player.update(
        dt,
        this.input,
        this.world.collision,
        this.world.cameraMode === "room",
        this.world.tryPush?.bind(this.world),
        state.debugNoclip,
      );
    this.interactions.update(this.player.position, this.world, this.time);
    this.camera.update(this.player.position, dt);
    this.updateSun();
    this.renderer.render(this.scene, this.camera.camera);
    this.frame = requestAnimationFrame(this.tick);
  };
  dispose() {
    cancelAnimationFrame(this.frame);
    this.renderer.domElement.removeEventListener(
      "pointerdown",
      this.pointerDown,
    );
    this.renderer.domElement.removeEventListener("pointerup", this.pointerUp);
    this.renderer.domElement.removeEventListener(
      "pointercancel",
      this.cancelTap,
    );
    window.removeEventListener("blur", this.cancelTap);
    document.removeEventListener("visibilitychange", this.visibilityTap);
    this.renderer.domElement.removeEventListener(
      "pointermove",
      this.pointerMove,
    );
    this.unsubscribeEquipment();
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
