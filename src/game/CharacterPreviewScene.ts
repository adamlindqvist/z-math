import * as THREE from "three";
import type { Equipment } from "../items/definitions";
import { disposeTree } from "./Area";
import { applyEquipment, heroModel } from "./heroModel";

/** Owns only preview resources; never attaches the live player's model. */
export class CharacterPreviewScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1.6, 1.6, 1.6, -1.6, 0.1, 20);
  private hero = heroModel();
  private failed = false;
  private disposed = false;
  private lost = (event: Event) => {
    event.preventDefault();
    this.fail();
  };
  constructor(
    private canvas: HTMLCanvasElement,
    private onError: () => void,
  ) {
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
    } catch (error) {
      disposeTree(this.hero.root);
      throw error;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this.scene.add(
      this.hero.root,
      new THREE.HemisphereLight(0xffffff, 0x8a9977, 2),
    );
    const light = new THREE.DirectionalLight(0xfff3d6, 3);
    light.position.set(3, 5, 4);
    this.scene.add(light);
    this.hero.root.rotation.y = -0.35;
    this.camera.position.set(0, 1.5, 6);
    this.camera.lookAt(0, 0.95, 0);
    canvas.addEventListener("webglcontextlost", this.lost);
  }
  private fail() {
    if (this.failed || this.disposed) return;
    this.failed = true;
    this.onError();
  }
  private render() {
    if (this.failed || this.disposed) return;
    try {
      this.renderer.render(this.scene, this.camera);
    } catch {
      this.fail();
    }
  }
  resize(width: number, height: number) {
    if (this.failed || this.disposed || width <= 0 || height <= 0) return;
    const aspect = width / height;
    const halfHeight = Math.max(1.4, 1.4 / aspect);
    this.camera.left = -halfHeight * aspect;
    this.camera.right = halfHeight * aspect;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.render();
  }
  setEquipment(equipment: Equipment) {
    applyEquipment(this.hero, equipment);
    this.render();
  }
  rotate(angle: number) {
    this.hero.root.rotation.y += angle;
    this.render();
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.canvas.removeEventListener("webglcontextlost", this.lost);
    disposeTree(this.hero.root);
    this.renderer.dispose();
    // React StrictMode reuses the canvas for its next effect setup.
    // dispose releases GPU resources without invalidating that canvas context.
  }
}
